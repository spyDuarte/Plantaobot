import { createClient } from '@supabase/supabase-js';
import { createHttpError, normalizeAuthError } from '../errors.js';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function buildRedirectUrl(appBaseUrl) {
  const base = trimTrailingSlash(appBaseUrl || 'http://localhost:5173');
  return `${base}/`;
}

function createAnonClient(config) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw createHttpError(500, 'SUPABASE_ENV_MISSING', 'Supabase auth env vars are not configured.');
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAuthService(config) {
  return {
    async signUp({ name, email, password }) {
      try {
        const client = createAnonClient(config);
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: buildRedirectUrl(config.appBaseUrl),
          },
        });

        if (error) {
          throw normalizeAuthError(error);
        }

        return {
          user: data.user,
          session: data.session || null,
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async login({ email, password }) {
      try {
        const client = createAnonClient(config);
        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          throw normalizeAuthError(error);
        }

        return {
          user: data.user,
          session: data.session,
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async logout({ accessToken, refreshToken }) {
      if (!accessToken || !refreshToken) {
        return;
      }

      try {
        const client = createAnonClient(config);
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          return;
        }

        await client.auth.signOut();
      } catch {
        // Explicit logout is best-effort because cookies are always cleared by the BFF.
      }
    },

    async getUser(accessToken) {
      try {
        const client = createAnonClient(config);
        const { data, error } = await client.auth.getUser(accessToken);

        if (error || !data?.user) {
          throw normalizeAuthError(error || new Error('Missing user in session.'));
        }

        return data.user;
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async refreshSession(refreshToken) {
      try {
        const client = createAnonClient(config);
        const { data, error } = await client.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (error || !data?.session || !data?.user) {
          throw normalizeAuthError(error || new Error('Unable to refresh session.'));
        }

        return {
          user: data.user,
          session: data.session,
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async resendVerification({ email }) {
      try {
        const client = createAnonClient(config);
        const { error } = await client.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: buildRedirectUrl(config.appBaseUrl),
          },
        });

        if (error) {
          throw normalizeAuthError(error);
        }
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async forgotPassword({ email }) {
      try {
        const client = createAnonClient(config);
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: buildRedirectUrl(config.appBaseUrl),
        });

        if (error) {
          throw normalizeAuthError(error);
        }
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async confirm({ tokenHash, type }) {
      try {
        const client = createAnonClient(config);
        const { data, error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (error || !data?.user) {
          throw normalizeAuthError(error || new Error('Unable to confirm token.'));
        }

        return {
          user: data.user,
          session: data.session || null,
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },

    async resetPassword({ accessToken, refreshToken, newPassword }) {
      try {
        if (!accessToken || !refreshToken) {
          throw createHttpError(401, 'UNAUTHORIZED', 'Missing auth session.');
        }

        const client = createAnonClient(config);
        const { data: sessionData, error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError || !sessionData?.session) {
          throw normalizeAuthError(sessionError || new Error('Unable to attach current session.'));
        }

        const { data: updatedData, error: updateError } = await client.auth.updateUser({
          password: newPassword,
        });

        if (updateError || !updatedData?.user) {
          throw normalizeAuthError(updateError || new Error('Unable to update password.'));
        }

        const { data: refreshedData } = await client.auth.refreshSession();

        return {
          user: updatedData.user,
          session: refreshedData?.session || sessionData.session,
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
  };
}
