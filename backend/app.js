import express from 'express';
import cookieParser from 'cookie-parser';
import { createHttpError, isHttpError, toErrorPayload } from './errors.js';
import {
  COOKIE_NAMES,
  clearAuthCookies,
  csrfProtection,
  ensureCsrfCookie,
  setAuthCookies,
} from './security.js';
import {
  validateBootstrapImport,
  validateChatPayload,
  validateConfirm,
  validateEmailPayload,
  validateEvent,
  validateGroups,
  validateLogin,
  validateMonitorStart,
  validateOfferMutation,
  validatePreferences,
  validateResetPassword,
  validateSignup,
} from './validation.js';
import { createSupabaseAuthService } from './services/supabaseAuthService.js';
import { createSupabaseDataStore } from './services/supabaseDataStore.js';
import { createWhatsappProvider } from './services/whatsappProvider.js';
import {
  isShiftOffer,
  normalizeIncomingWebhook,
  parseShiftOffer,
} from './services/whatsappParser.js';

function defaultConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return {
    nodeEnv,
    port: Number(process.env.PORT || 8080),
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    cookieSecret: process.env.COOKIE_SECRET || '',
    cookieDomain: process.env.COOKIE_DOMAIN || '',
    secureCookies: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : nodeEnv === 'production',
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGIN || '',
    evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
    evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
  };
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function isEmailVerified(user) {
  return Boolean(user?.email_confirmed_at);
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
    metadata: user.user_metadata || {},
  };
}

function normalizeProfile(profile, user) {
  if (!profile) {
    return {
      id: user.id,
      name: user?.user_metadata?.name || '',
      bootstrap_imported_at: null,
    };
  }

  return {
    id: profile.id,
    name: profile.name || user?.user_metadata?.name || '',
    bootstrap_imported_at: profile.bootstrap_imported_at || null,
    created_at: profile.created_at || null,
    updated_at: profile.updated_at || null,
  };
}

async function resolveSession(req, res, { authService, config }) {
  if (req.auth) {
    return req.auth;
  }

  const accessToken = req.cookies?.[COOKIE_NAMES.accessToken];
  const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];

  const bearerToken = (() => {
    const h = req.headers.authorization;
    return h?.startsWith('Bearer ') ? h.slice(7) : null;
  })();

  if (!accessToken && !refreshToken && !bearerToken) {
    throw createHttpError(401, 'UNAUTHORIZED', 'Sessão não encontrada.');
  }

  let user = null;
  let session = null;

  if (accessToken) {
    try {
      user = await authService.getUser(accessToken);
      session = {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (!isHttpError(error) || error.status >= 500) {
        throw error;
      }
    }
  }

  if (!user && refreshToken) {
    const refreshed = await authService.refreshSession(refreshToken);
    user = refreshed.user;
    session = refreshed.session;
    setAuthCookies(res, session, config);
  }

  // No cookie session: accept Supabase bearer token from Authorization header.
  // Supports cross-origin deployments (e.g. GitHub Pages → Render) where
  // HttpOnly cookies cannot be shared across origins.
  if (!user && bearerToken) {
    user = await authService.getUser(bearerToken);
    session = { access_token: bearerToken };
  }

  if (!user || !session) {
    clearAuthCookies(res, config);
    throw createHttpError(401, 'UNAUTHORIZED', 'Sessão inválida.');
  }

  req.auth = {
    user,
    session,
    emailVerified: isEmailVerified(user),
  };

  return req.auth;
}

function requireAuth({ allowUnverified = false } = {}, deps) {
  return asyncRoute(async (req, res, next) => {
    const auth = await resolveSession(req, res, deps);

    if (!allowUnverified && !auth.emailVerified) {
      throw createHttpError(403, 'EMAIL_NOT_VERIFIED', 'Confirme o email antes de acessar os recursos protegidos.');
    }

    next();
  });
}

function parseGroupIds(queryValue) {
  if (Array.isArray(queryValue)) {
    return queryValue.map((value) => String(value));
  }

  if (!queryValue) {
    return [];
  }

  return [String(queryValue)];
}

function normalizeOrigin(value) {
  if (!value) {
    return '';
  }

  try {
    return new URL(String(value)).origin;
  } catch {
    return String(value).replace(/\/+$/, '');
  }
}

function buildAllowedOrigins(config) {
  const fromEnv = String(config.corsAllowedOrigins || '')
    .split(',')
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean);

  const appOrigin = normalizeOrigin(config.appBaseUrl);
  if (appOrigin && !fromEnv.includes(appOrigin)) {
    fromEnv.push(appOrigin);
  }

  return new Set(fromEnv);
}

function applyCors(req, res, allowedOrigins) {
  const origin = req.get('origin');
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (!allowedOrigins.has(normalizedOrigin)) {
    return false;
  }

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  return true;
}

export function createApp(options = {}) {
  const config = {
    ...defaultConfig(),
    ...(options.config || {}),
  };

  const authService = options.authService || createSupabaseAuthService(config);
  const dataStore = options.dataStore || createSupabaseDataStore(config);
  const whatsappProvider = options.whatsappProvider || (
    config.evolutionApiUrl && config.evolutionApiKey
      ? createWhatsappProvider(config)
      : null
  );

  const deps = {
    config,
    authService,
    dataStore,
    whatsappProvider,
  };

  const app = express();
  const allowedOrigins = buildAllowedOrigins(config);

  app.disable('x-powered-by');

  if (String(config.cookieSameSite || 'lax').toLowerCase() === 'none' && !config.secureCookies) {
    console.warn('[backend] COOKIE_SAME_SITE=none requer COOKIE_SECURE=true em navegadores modernos.');
  }

  app.use((req, res, next) => {
    const allowed = applyCors(req, res, allowedOrigins);
    if (!allowed) {
      res.status(403).json({
        error: 'ORIGIN_NOT_ALLOWED',
        message: 'Origin não permitida por CORS.',
      });
      return;
    }

    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(config.cookieSecret || undefined));

  // ─── WhatsApp Webhook (CSRF-exempt: authenticated by per-user webhook token) ───

  // GET /api/whatsapp/webhook/:userId — WhatsApp Business Cloud API hub verification
  app.get('/api/whatsapp/webhook/:userId', asyncRoute(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token && challenge) {
      const userId = String(req.params.userId);
      const valid = await dataStore.validateWebhookToken(userId, token);
      if (valid) {
        return res.status(200).send(challenge);
      }
    }

    res.status(403).json({ error: 'FORBIDDEN', message: 'Token de verificação inválido.' });
  }));

  // POST /api/whatsapp/webhook/:userId — incoming messages from Evolution API or WhatsApp Cloud
  app.post('/api/whatsapp/webhook/:userId', asyncRoute(async (req, res) => {
    const userId = String(req.params.userId);
    const token =
      req.query.token ||
      req.headers['x-webhook-secret'] ||
      req.headers['x-hub-signature-256']?.replace('sha256=', '') ||
      null;

    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token não fornecido.' });
    }

    const valid = await dataStore.validateWebhookToken(userId, token);
    if (!valid) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido.' });
    }

    const normalized = normalizeIncomingWebhook(req.body);
    if (!normalized) {
      // Acknowledge unrecognized or non-text payloads silently
      return res.json({ ok: true, processed: false });
    }

    const offerFound = isShiftOffer(normalized.text);
    const offer = offerFound
      ? parseShiftOffer(normalized.text, {
          groupName: normalized.groupName || normalized.senderName,
          senderName: normalized.senderName,
          messageId: normalized.messageId,
        })
      : null;

    await dataStore.saveWhatsappMessage(userId, {
      messageId: normalized.messageId,
      jid: normalized.jid,
      groupName: normalized.groupName || normalized.senderName,
      senderName: normalized.senderName,
      rawText: normalized.text,
      isOffer: offerFound,
      offer,
      receivedAt: normalized.timestamp,
    });

    res.json({ ok: true, processed: true, isOffer: offerFound });
  }));

  // ─────────────────────────────────────────────────────────────────────────────

  app.use((req, res, next) => {
    ensureCsrfCookie(req, res, config);
    next();
  });

  app.use('/api', csrfProtection);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.post('/api/auth/signup', asyncRoute(async (req, res) => {
    const payload = validateSignup(req.body);
    const result = await authService.signUp(payload);

    if (result.user?.id) {
      await dataStore.ensureProfile({
        userId: result.user.id,
        name: payload.name,
      });
    }

    if (result.session) {
      setAuthCookies(res, result.session, config);
    }

    const emailVerified = isEmailVerified(result.user);

    res.status(201).json({
      user: toPublicUser(result.user),
      emailVerified,
      requiresEmailVerification: !emailVerified,
    });
  }));

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const payload = validateLogin(req.body);
    const result = await authService.login(payload);

    if (!isEmailVerified(result.user)) {
      throw createHttpError(403, 'EMAIL_NOT_VERIFIED', 'Confirme o email antes de acessar o app.');
    }

    setAuthCookies(res, result.session, config);

    await dataStore.ensureProfile({
      userId: result.user.id,
      name: result.user?.user_metadata?.name,
    });

    const profile = await dataStore.getProfile(result.user.id);

    res.json({
      user: toPublicUser(result.user),
      profile: normalizeProfile(profile, result.user),
      emailVerified: true,
    });
  }));

  app.post('/api/auth/logout', asyncRoute(async (req, res) => {
    const accessToken = req.cookies?.[COOKIE_NAMES.accessToken];
    const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];

    await authService.logout({ accessToken, refreshToken });
    clearAuthCookies(res, config);

    res.status(204).send();
  }));

  app.get('/api/auth/me', asyncRoute(async (req, res) => {
    const auth = await resolveSession(req, res, deps);

    await dataStore.ensureProfile({
      userId: auth.user.id,
      name: auth.user?.user_metadata?.name,
    });

    const profile = await dataStore.getProfile(auth.user.id);

    res.json({
      user: toPublicUser(auth.user),
      profile: normalizeProfile(profile, auth.user),
      emailVerified: auth.emailVerified,
    });
  }));

  app.post('/api/auth/resend-verification', asyncRoute(async (req, res) => {
    const payload = validateEmailPayload(req.body);
    await authService.resendVerification(payload);
    res.json({ ok: true });
  }));

  app.post('/api/auth/forgot-password', asyncRoute(async (req, res) => {
    const payload = validateEmailPayload(req.body);
    await authService.forgotPassword(payload);
    res.json({ ok: true });
  }));

  app.post('/api/auth/confirm', asyncRoute(async (req, res) => {
    const payload = validateConfirm(req.body);
    const result = await authService.confirm(payload);

    if (result.session) {
      setAuthCookies(res, result.session, config);
    }

    if (result.user?.id) {
      await dataStore.ensureProfile({
        userId: result.user.id,
        name: result.user?.user_metadata?.name,
      });
    }

    res.json({
      user: toPublicUser(result.user),
      emailVerified: isEmailVerified(result.user),
      type: payload.type,
    });
  }));

  app.post('/api/auth/reset-password', requireAuth({ allowUnverified: true }, deps), asyncRoute(async (req, res) => {
    const payload = validateResetPassword(req.body);
    const result = await authService.resetPassword({
      accessToken: req.cookies?.[COOKIE_NAMES.accessToken],
      refreshToken: req.cookies?.[COOKIE_NAMES.refreshToken],
      newPassword: payload.newPassword,
    });

    if (result.session) {
      setAuthCookies(res, result.session, config);
    }

    res.json({
      ok: true,
      user: toPublicUser(result.user),
    });
  }));

  app.post('/api/auth/bootstrap-import', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateBootstrapImport(req.body);
    const result = await dataStore.bootstrapImport({
      userId: req.auth.user.id,
      prefs: payload.prefs,
      groups: payload.groups,
      captured: payload.captured,
      rejected: payload.rejected,
      profileName: req.auth.user?.user_metadata?.name,
    });

    res.json(result);
  }));

  app.get('/api/monitor/status', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const status = await dataStore.getMonitorStatus(req.auth.user.id);
    res.json(status);
  }));

  app.post('/api/monitor/start', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateMonitorStart(req.body);
    const result = await dataStore.startMonitoring(req.auth.user.id, payload);
    res.json({ sessionId: result.sessionId, active: true });
  }));

  app.post('/api/monitor/stop', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const sessionId = req.body?.sessionId ? String(req.body.sessionId) : null;
    await dataStore.stopMonitoring(req.auth.user.id, { sessionId });
    res.json({ ok: true });
  }));

  app.get('/api/monitor/feed', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const sessionId = req.query.sessionId ? String(req.query.sessionId) : null;
    const groupIds = parseGroupIds(req.query.groupId);

    const result = await dataStore.fetchFeed(req.auth.user.id, {
      cursor,
      sessionId,
      groupIds,
    });

    res.json({
      items: result.items || [],
      nextCursor: result.nextCursor || null,
    });
  }));

  app.get('/api/captures', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const items = await dataStore.listCaptures(req.auth.user.id);
    res.json({ items });
  }));

  app.post('/api/captures', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateOfferMutation(req.body);
    const item = await dataStore.addCapture(req.auth.user.id, payload);
    res.status(201).json({ item });
  }));

  app.delete('/api/captures', requireAuth({}, deps), asyncRoute(async (req, res) => {
    await dataStore.clearCaptures(req.auth.user.id);
    res.status(204).send();
  }));

  app.get('/api/rejections', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const items = await dataStore.listRejections(req.auth.user.id);
    res.json({ items });
  }));

  app.post('/api/rejections', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateOfferMutation(req.body);
    const item = await dataStore.addRejection(req.auth.user.id, payload);
    res.status(201).json({ item });
  }));

  app.delete('/api/rejections', requireAuth({}, deps), asyncRoute(async (req, res) => {
    await dataStore.clearRejections(req.auth.user.id);
    res.status(204).send();
  }));

  app.get('/api/preferences', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const preferences = await dataStore.getPreferences(req.auth.user.id);
    res.json({ preferences: preferences || {} });
  }));

  app.put('/api/preferences', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validatePreferences(req.body);
    await dataStore.savePreferences(req.auth.user.id, payload.preferences);
    res.json({ ok: true });
  }));

  app.get('/api/groups', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const groups = await dataStore.getGroups(req.auth.user.id);
    res.json({ groups });
  }));

  app.put('/api/groups', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateGroups(req.body);
    await dataStore.saveGroups(req.auth.user.id, payload.groups);
    res.json({ ok: true });
  }));

  app.delete('/api/history', requireAuth({}, deps), asyncRoute(async (req, res) => {
    await dataStore.clearHistory(req.auth.user.id);
    res.status(204).send();
  }));

  app.post('/api/events', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const payload = validateEvent(req.body);
    await dataStore.trackEvent(req.auth.user.id, payload);
    res.status(201).json({ ok: true });
  }));

  // GET /api/whatsapp/config — returns webhook URL token and connection status
  app.get('/api/whatsapp/config', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const waConfig = await dataStore.getWhatsappConfig(req.auth.user.id);
    const messageCount = await dataStore.getWhatsappMessageCount(req.auth.user.id);
    res.json({ ...waConfig, messageCount });
  }));

  // POST /api/whatsapp/config/reset-token — rotates the webhook secret token
  app.post('/api/whatsapp/config/reset-token', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const result = await dataStore.resetWebhookToken(req.auth.user.id);
    res.json(result);
  }));

  // POST /api/whatsapp/connect — creates/reuses instance and returns QR for pairing
  app.post('/api/whatsapp/connect', requireAuth({}, deps), asyncRoute(async (req, res) => {
    if (!whatsappProvider) {
      throw createHttpError(503, 'EVOLUTION_NOT_CONFIGURED', 'Integração Evolution API não configurada no servidor.');
    }

    const userId = req.auth.user.id;
    const current = await dataStore.getWhatsappConfig(userId);

    const created = current.instanceId
      ? { instanceId: current.instanceId }
      : await whatsappProvider.createInstanceForUser({ userId });

    await dataStore.saveWhatsappInstanceMetadata(userId, {
      instanceId: created.instanceId,
      connected: false,
    });

    const qr = await whatsappProvider.getInstanceQr({ instanceId: created.instanceId });

    res.json({
      instanceId: created.instanceId,
      qrCode: qr.qrCode,
      state: qr.state || 'connecting',
      connected: false,
    });
  }));

  app.post('/api/chat', requireAuth({}, deps), asyncRoute(async (req, res) => {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      throw createHttpError(503, 'AI_UNAVAILABLE', 'Serviço de IA não configurado.');
    }

    const payload = validateChatPayload(req.body);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: payload.system || undefined,
        messages: payload.messages,
      }),
    });

    if (!anthropicRes.ok) {
      throw createHttpError(502, 'AI_ERROR', 'Erro ao comunicar com a IA.');
    }

    const data = await anthropicRes.json();
    res.json({ reply: data.content?.[0]?.text || '' });
  }));

  app.use((error, _req, res, _next) => {
    const normalized = isHttpError(error) ? error : createHttpError(500, 'INTERNAL_ERROR', error?.message);
    const { status, payload } = toErrorPayload(normalized);

    if (status >= 500) {
      console.error('[backend:error]', error);
    }

    res.status(status).json(payload);
  });

  return app;
}
