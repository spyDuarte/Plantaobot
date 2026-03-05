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

  function ensureCollections(userId) {
    if (!captures.has(userId)) {
      captures.set(userId, []);
    }

    if (!rejections.has(userId)) {
      rejections.set(userId, []);
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
