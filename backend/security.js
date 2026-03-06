import crypto from 'node:crypto';
import { createHttpError } from './errors.js';

export const COOKIE_NAMES = {
  accessToken: 'pb_at',
  refreshToken: 'pb_rt',
  csrfToken: 'pb_csrf',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function baseCookieOptions(config) {
  const sameSite = ['lax', 'strict', 'none'].includes(String(config.cookieSameSite || '').toLowerCase())
    ? String(config.cookieSameSite).toLowerCase()
    : 'lax';

  const options = {
    sameSite,
    secure: Boolean(config.secureCookies),
    path: '/',
  };

  if (config.cookieDomain) {
    options.domain = config.cookieDomain;
  }

  return options;
}

export function authCookieOptions(config, { maxAgeMs }) {
  return {
    ...baseCookieOptions(config),
    httpOnly: true,
    maxAge: maxAgeMs,
  };
}

export function csrfCookieOptions(config) {
  return {
    ...baseCookieOptions(config),
    httpOnly: false,
    maxAge: 7 * ONE_DAY_MS,
  };
}

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function setAuthCookies(res, session, config) {
  if (!session?.access_token || !session?.refresh_token) {
    return;
  }

  res.cookie(
    COOKIE_NAMES.accessToken,
    session.access_token,
    authCookieOptions(config, {
      maxAgeMs: Number(session.expires_in || 3600) * 1000,
    }),
  );

  res.cookie(
    COOKIE_NAMES.refreshToken,
    session.refresh_token,
    authCookieOptions(config, {
      maxAgeMs: 30 * ONE_DAY_MS,
    }),
  );
}

export function clearAuthCookies(res, config) {
  const clear = { ...baseCookieOptions(config), httpOnly: true, maxAge: 0 };
  res.clearCookie(COOKIE_NAMES.accessToken, clear);
  res.clearCookie(COOKIE_NAMES.refreshToken, clear);
}

export function ensureCsrfCookie(req, res, config) {
  const current = req.cookies?.[COOKIE_NAMES.csrfToken];
  if (typeof current === 'string' && current.length >= 24) {
    return current;
  }

  const token = generateCsrfToken();
  res.cookie(COOKIE_NAMES.csrfToken, token, csrfCookieOptions(config));
  return token;
}

export function csrfProtection(req, _res, next) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  // Bearer token requests are inherently CSRF-safe: browsers cannot automatically
  // attach Authorization headers in cross-site requests, so no cookie-based
  // CSRF token is required when the client authenticates via a bearer token.
  if (req.headers.authorization?.startsWith('Bearer ')) {
    next();
    return;
  }

  const csrfCookie = req.cookies?.[COOKIE_NAMES.csrfToken];
  const csrfHeader = req.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader)) {
    next(createHttpError(403, 'CSRF_INVALID', 'Token CSRF inválido.'));
    return;
  }

  next();
}

