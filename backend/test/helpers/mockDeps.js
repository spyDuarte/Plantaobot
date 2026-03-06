import { createHttpError } from '../../errors.js';

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password: _password, ...safe } = user;
  return safe;
}

export function createMockAuthService() {
  const usersByEmail = new Map();
  const usersById = new Map();
  const sessionsByAccessToken = new Map();
  const emailByRefreshToken = new Map();
  let counter = 1;

  function newSession(user) {
    const access = `at-${counter}-${Math.random().toString(36).slice(2, 8)}`;
    const refresh = `rt-${counter}-${Math.random().toString(36).slice(2, 8)}`;
    counter += 1;

    sessionsByAccessToken.set(access, user.id);
    emailByRefreshToken.set(refresh, user.email);

    return {
      access_token: access,
      refresh_token: refresh,
      expires_in: 3600,
      user: sanitizeUser(user),
    };
  }

  return {
    async signUp({ name, email, password }) {
      if (usersByEmail.has(email)) {
        throw createHttpError(422, 'USER_ALREADY_EXISTS', 'Já existe conta para este email.');
      }

      const user = {
        id: `user-${counter}`,
        email,
        password,
        email_confirmed_at: null,
        created_at: new Date().toISOString(),
        user_metadata: {
          name,
        },
      };

      usersByEmail.set(email, user);
      usersById.set(user.id, user);

      return {
        user: sanitizeUser(user),
        session: null,
      };
    },

    async login({ email, password }) {
      const user = usersByEmail.get(email);
      if (!user || user.password !== password) {
        throw createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos.');
      }

      if (!user.email_confirmed_at) {
        throw createHttpError(403, 'EMAIL_NOT_CONFIRMED', 'Confirme o email antes de continuar.');
      }

      return {
        user: sanitizeUser(user),
        session: newSession(user),
      };
    },

    async logout() {
      return;
    },

    async getUser(accessToken) {
      const userId = sessionsByAccessToken.get(accessToken);
      if (!userId) {
        throw createHttpError(401, 'UNAUTHORIZED', 'Sessão inválida.');
      }

      return sanitizeUser(usersById.get(userId));
    },

    async refreshSession(refreshToken) {
      const email = emailByRefreshToken.get(refreshToken);
      if (!email) {
        throw createHttpError(401, 'SESSION_EXPIRED', 'Refresh token inválido.');
      }

      const user = usersByEmail.get(email);
      if (!user) {
        throw createHttpError(401, 'UNAUTHORIZED', 'Usuário não encontrado.');
      }

      return {
        user: sanitizeUser(user),
        session: newSession(user),
      };
    },

    async resendVerification() {
      return;
    },

    async forgotPassword() {
      return;
    },

    async confirm({ tokenHash, type }) {
      const email = tokenHash;
      const user = usersByEmail.get(email);

      if (!user) {
        throw createHttpError(401, 'INVALID_TOKEN', 'Token inválido.');
      }

      if (type === 'signup') {
        user.email_confirmed_at = new Date().toISOString();
      }

      return {
        user: sanitizeUser(user),
        session: type === 'recovery' ? newSession(user) : null,
      };
    },

    async resetPassword({ accessToken, newPassword }) {
      const userId = sessionsByAccessToken.get(accessToken);
      if (!userId) {
        throw createHttpError(401, 'UNAUTHORIZED', 'Sessão inválida.');
      }

      const user = usersById.get(userId);
      user.password = newPassword;

      return {
        user: sanitizeUser(user),
        session: newSession(user),
      };
    },
  };
}

export function createMockDataStore() {
  const profiles = new Map();
  const preferences = new Map();
  const groups = new Map();
  const captures = new Map();
  const rejections = new Map();
  const monitor = new Map();
  const imported = new Set();
  const whatsappConfig = new Map();
  const whatsappMessages = new Map();

  function ensureCollections(userId) {
    if (!captures.has(userId)) {
      captures.set(userId, []);
    }

    if (!rejections.has(userId)) {
      rejections.set(userId, []);
    }

    if (!whatsappMessages.has(userId)) {
      whatsappMessages.set(userId, []);
    }
  }

  return {
    async ensureProfile({ userId, name }) {
      const current = profiles.get(userId) || {
        id: userId,
        name: null,
        bootstrap_imported_at: null,
      };

      if (name) {
        current.name = name;
      }

      profiles.set(userId, current);
    },

    async getProfile(userId) {
      if (!profiles.has(userId)) {
        profiles.set(userId, {
          id: userId,
          name: null,
          bootstrap_imported_at: null,
        });
      }

      return profiles.get(userId);
    },

    async bootstrapImport({ userId, prefs, groups: rawGroups, captured, rejected }) {
      ensureCollections(userId);
      if (imported.has(userId)) {
        return { imported: false, alreadyImported: true };
      }

      preferences.set(userId, prefs || {});
      groups.set(userId, rawGroups || []);
      captures.set(userId, captured || []);
      rejections.set(userId, rejected || []);

      imported.add(userId);
      const profile = profiles.get(userId) || { id: userId, name: null };
      profile.bootstrap_imported_at = new Date().toISOString();
      profiles.set(userId, profile);

      return { imported: true, alreadyImported: false };
    },

    async getMonitorStatus(userId) {
      return monitor.get(userId) || { active: false, sessionId: null };
    },

    async startMonitoring(userId) {
      const status = { active: true, sessionId: `session-${Date.now()}` };
      monitor.set(userId, status);
      return { sessionId: status.sessionId };
    },

    async stopMonitoring(userId) {
      monitor.set(userId, { active: false, sessionId: null });
    },

    async fetchFeed(_userId, { cursor }) {
      return { items: [], nextCursor: cursor || new Date().toISOString() };
    },

    async getWhatsappConfig(userId) {
      if (!whatsappConfig.has(userId)) {
        whatsappConfig.set(userId, {
          userId,
          webhookToken: `token-${userId}`,
          instanceId: null,
          connected: false,
          connectedAt: null,
        });
      }

      return whatsappConfig.get(userId);
    },

    async getWhatsappStatus(userId) {
      const current = await this.getWhatsappConfig(userId);
      return {
        connected: Boolean(current.connected),
        connectedAt: current.connectedAt || null,
        instanceId: current.instanceId || null,
        phoneNumber: current.phoneNumber || null,
      };
    },

    async getWhatsappMessageCount(userId) {
      ensureCollections(userId);
      return whatsappMessages.get(userId).length;
    },

    async saveWhatsappMessage(userId, payload) {
      ensureCollections(userId);
      const current = whatsappMessages.get(userId);
      const messageId = payload?.messageId || null;
      if (messageId && current.some((item) => item.messageId === messageId)) {
        return;
      }

      current.push({ ...payload, messageId });
      whatsappMessages.set(userId, current);
    },


    async validateWebhookToken(userId, token) {
      const current = await this.getWhatsappConfig(userId);
      return current.webhookToken === token;
    },
    async resetWebhookToken(userId) {
      const current = await this.getWhatsappConfig(userId);
      const webhookToken = `token-${Date.now()}`;
      const next = { ...current, webhookToken };
      whatsappConfig.set(userId, next);
      return { webhookToken };
    },

    async saveWhatsappInstanceMetadata(userId, { instanceId, connected = false }) {
      const current = await this.getWhatsappConfig(userId);
      whatsappConfig.set(userId, {
        ...current,
        instanceId: instanceId || null,
        connected: Boolean(connected),
        connectedAt: connected ? new Date().toISOString() : null,
      });
    },

    async saveWhatsappStatusTransition(userId, { connected, instanceId = null, phoneNumber = null }) {
      const current = await this.getWhatsappConfig(userId);
      whatsappConfig.set(userId, {
        ...current,
        connected: Boolean(connected),
        connectedAt: connected ? new Date().toISOString() : null,
        instanceId: instanceId || current.instanceId || null,
        phoneNumber: phoneNumber || current.phoneNumber || null,
      });
    },

    async listCaptures(userId) {
      ensureCollections(userId);
      return captures.get(userId);
    },

    async addCapture(userId, payload) {
      ensureCollections(userId);
      const item = {
        ...payload.offer,
        id: payload.offer.id || `capture-${Date.now()}`,
      };
      captures.set(userId, [item, ...captures.get(userId)]);
      return item;
    },

    async clearCaptures(userId) {
      captures.set(userId, []);
    },

    async listRejections(userId) {
      ensureCollections(userId);
      return rejections.get(userId);
    },

    async addRejection(userId, payload) {
      ensureCollections(userId);
      const item = {
        ...payload.offer,
        id: payload.offer.id || `reject-${Date.now()}`,
      };
      rejections.set(userId, [item, ...rejections.get(userId)]);
      return item;
    },

    async clearRejections(userId) {
      rejections.set(userId, []);
    },

    async getPreferences(userId) {
      return preferences.get(userId) || null;
    },

    async savePreferences(userId, value) {
      preferences.set(userId, value);
    },

    async getGroups(userId) {
      return groups.get(userId) || [];
    },

    async saveGroups(userId, value) {
      groups.set(userId, value);
    },

    async mergeGroups(userId, value) {
      const current = groups.get(userId) || [];
      const activeById = new Map(current.map((group) => [String(group.id), Boolean(group.active)]));

      const merged = (Array.isArray(value) ? value : []).map((group) => {
        const id = String(group.id);
        return {
          ...group,
          id,
          active: activeById.has(id) ? activeById.get(id) : Boolean(group.active),
        };
      });

      groups.set(userId, merged);
      return merged;
    },

    async isActiveGroupByJidOrName(userId, { jid, groupName } = {}) {
      const current = groups.get(userId) || [];
      const normalizedJid = String(jid || '').trim().toLowerCase();
      const normalizedGroupName = String(groupName || '').trim().toLowerCase();

      if (!normalizedJid && !normalizedGroupName) {
        return false;
      }

      return current.some((group) => {
        if (!group || !group.active) {
          return false;
        }

        const groupId = String(group.id || '').trim().toLowerCase();
        const name = String(group.name || '').trim().toLowerCase();

        if (normalizedJid && groupId === normalizedJid) {
          return true;
        }

        if (normalizedGroupName && name === normalizedGroupName) {
          return true;
        }

        return false;
      });
    },

    async clearHistory(userId) {
      captures.set(userId, []);
      rejections.set(userId, []);
    },

    async trackEvent() {
      return;
    },
  };
}

export function extractCsrfToken(setCookieHeader = []) {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const csrfCookie = cookies.find((cookie) => cookie.startsWith('pb_csrf='));
  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split(';')[0].split('=')[1];
}
