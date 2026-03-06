import { ApiError, apiRequest } from './apiClient.js';
import { getAuthRedirectUrl, getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js';

const AUTH_PROVIDER = String(import.meta.env.VITE_AUTH_PROVIDER || 'supabase').toLowerCase();

function mapSupabaseError(error, fallbackMessage, status = 400) {
  return new ApiError(error?.message || fallbackMessage, {
    status,
    data: error,
    path: '/auth',
  });
}

function getClientOrThrow() {
  const client = getSupabaseClient();

  if (!client || !isSupabaseConfigured()) {
    throw new ApiError('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.', {
      status: 500,
      path: '/auth/config',
    });
  }

  return client;
}

async function fetchProfile(client, userId) {
  if (!userId) {
    return null;
  }

  const { data } = await client.from('profiles').select('id,name').eq('id', userId).maybeSingle();
  return data || null;
}

function mapSessionToMePayload(session, profile) {
  const user = session?.user;

  if (!user) {
    throw new ApiError('Sessão inválida.', {
      status: 401,
      path: '/auth/me',
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    profile: profile || {
      id: user.id,
      name: user.user_metadata?.name || '',
    },
    emailVerified: Boolean(user.email_confirmed_at),
  };
}

async function signupWithSupabase(body) {
  const client = getClientOrThrow();
  const redirectTo = getAuthRedirectUrl();

  const { data, error } = await client.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: {
        name: body.name,
      },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw mapSupabaseError(error, 'Não foi possível criar sua conta.');
  }

  if (data.user) {
    await client.from('profiles').upsert({ id: data.user.id, name: body.name }, { onConflict: 'id' });
  }

  return {
    user: data.user || null,
    emailVerified: Boolean(data.user?.email_confirmed_at || data.session),
    requiresEmailVerification: !data.session,
  };
}

async function loginWithSupabase(body) {
  const client = getClientOrThrow();
  const { data, error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    const status = /Email not confirmed/i.test(error.message || '') ? 403 : 401;
    throw mapSupabaseError(error, 'Não foi possível fazer login.', status);
  }

  return {
    user: data.user,
    emailVerified: Boolean(data.user?.email_confirmed_at),
  };
}

async function logoutWithSupabase() {
  const client = getClientOrThrow();
  const { error } = await client.auth.signOut();
  if (error) {
    throw mapSupabaseError(error, 'Não foi possível encerrar sessão.');
  }

  return { ok: true };
}

async function fetchMeWithSupabase() {
  const client = getClientOrThrow();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw mapSupabaseError(error, 'Falha ao validar sessão.', 401);
  }

  if (!data?.session?.user) {
    throw new ApiError('Sessão inválida.', {
      status: 401,
      path: '/auth/me',
    });
  }

  const profile = await fetchProfile(client, data.session.user.id);
  return mapSessionToMePayload(data.session, profile);
}

async function resendVerificationWithSupabase(body) {
  const client = getClientOrThrow();
  const redirectTo = getAuthRedirectUrl();

  const { error } = await client.auth.resend({
    type: 'signup',
    email: body.email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw mapSupabaseError(error, 'Não foi possível reenviar o email de verificação.');
  }

  return { ok: true };
}

async function forgotPasswordWithSupabase(body) {
  const client = getClientOrThrow();
  const redirectTo = getAuthRedirectUrl();

  const { error } = await client.auth.resetPasswordForEmail(body.email, {
    redirectTo,
  });

  if (error) {
    throw mapSupabaseError(error, 'Não foi possível enviar o email de recuperação.');
  }

  return { ok: true };
}

async function confirmAuthWithSupabase(body) {
  const client = getClientOrThrow();
  const { data, error } = await client.auth.verifyOtp({
    token_hash: body.token_hash,
    type: body.type,
  });

  if (error) {
    throw mapSupabaseError(error, 'Nao foi possivel processar o link de confirmação.');
  }

  return { ok: true, emailVerified: Boolean(data.user?.email_confirmed_at || data.session) };
}

async function resetPasswordWithSupabase(body) {
  const client = getClientOrThrow();
  const { error } = await client.auth.updateUser({
    password: body.newPassword,
  });

  if (error) {
    throw mapSupabaseError(error, 'Não foi possível redefinir sua senha.');
  }

  return { ok: true };
}

async function bootstrapImportWithSupabase(body) {
  const client = getClientOrThrow();
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new ApiError('Sessão inválida.', { status: 401, path: '/auth/bootstrap-import' });
  }

  const { data: profile } = await client
    .from('profiles')
    .select('bootstrap_imported_at')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.bootstrap_imported_at) {
    return { imported: false, alreadyImported: true };
  }

  await client.from('preferences').upsert({ user_id: userId, preferences: body.prefs || {} }, { onConflict: 'user_id' });

  if (Array.isArray(body.groups) && body.groups.length > 0) {
    await client
      .from('groups')
      .upsert(
        body.groups.map((group) => ({
          user_id: userId,
          group_id: String(group.id),
          name: group.name || 'Grupo',
          members: Number(group.members || 0),
          active: Boolean(group.active),
          emoji: group.emoji || '🏥',
        })),
        { onConflict: 'user_id,group_id' },
      );
  }

  if (Array.isArray(body.captured) && body.captured.length > 0) {
    await client
      .from('captures')
      .upsert(
        body.captured.map((offer) => ({
          user_id: userId,
          offer_id: String(offer.id || `${Date.now()}`),
          offer,
          source: 'bootstrap',
        })),
        { onConflict: 'user_id,offer_id' },
      );
  }

  if (Array.isArray(body.rejected) && body.rejected.length > 0) {
    await client
      .from('rejections')
      .upsert(
        body.rejected.map((offer) => ({
          user_id: userId,
          offer_id: String(offer.id || `${Date.now()}`),
          offer,
          reason: 'bootstrap',
        })),
        { onConflict: 'user_id,offer_id' },
      );
  }

  await client
    .from('profiles')
    .upsert({ id: userId, bootstrap_imported_at: new Date().toISOString() }, { onConflict: 'id' });

  return { imported: true, alreadyImported: false };
}

export function signup(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body,
    });
  }

  return signupWithSupabase(body);
}

export function login(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/login', {
      method: 'POST',
      body,
    });
  }

  return loginWithSupabase(body);
}

export function logout() {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/logout', {
      method: 'POST',
      body: {},
    });
  }

  return logoutWithSupabase();
}

export function fetchMe() {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/me');
  }

  return fetchMeWithSupabase();
}

export function resendVerification(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/resend-verification', {
      method: 'POST',
      body,
    });
  }

  return resendVerificationWithSupabase(body);
}

export function forgotPassword(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body,
    });
  }

  return forgotPasswordWithSupabase(body);
}

export function confirmAuth(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/confirm', {
      method: 'POST',
      body,
    });
  }

  return confirmAuthWithSupabase(body);
}

export function resetPassword(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body,
    });
  }

  return resetPasswordWithSupabase(body);
}

export function bootstrapImport(body) {
  if (AUTH_PROVIDER === 'bff') {
    return apiRequest('/auth/bootstrap-import', {
      method: 'POST',
      body,
    });
  }

  return bootstrapImportWithSupabase(body);
}

export async function getAccessToken() {
  if (AUTH_PROVIDER === 'bff') {
    // BFF mode uses HttpOnly cookies — no bearer token needed.
    return null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data?.session?.access_token || null;
}
