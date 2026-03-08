import { ApiError } from './apiClient.js';
import { getSupabaseClient } from './supabaseClient.js';

function getClientOrThrow() {
  const client = getSupabaseClient();
  if (!client) {
    throw new ApiError('Supabase não configurado.', { status: 500, path: '/data' });
  }
  return client;
}

async function getUserId(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.user?.id) {
    throw new ApiError('Sessão inválida.', { status: 401, path: '/data' });
  }
  return data.session.user.id;
}

function throwIfError(error, path) {
  if (error) {
    throw new ApiError(error.message || 'Erro no Supabase.', { status: 500, path });
  }
}

// ── Captures ──────────────────────────────────────────────────────────────────

export async function fetchCapturedFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { data, error } = await client
    .from('captures')
    .select('offer_id, offer, source, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(error, '/captures');

  return (data || []).map((row) => ({
    ...(row.offer || {}),
    id: row.offer_id,
    source: row.source,
    capturedAt: row.created_at,
    capturedAtISO: row.created_at,
  }));
}

export async function captureOfferToSupabase(shift, { sessionId, source = 'manual' } = {}) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const offerId = String(shift.id || `${Date.now()}`);
  const offerPayload = {
    id: shift.id,
    hospital: shift.hospital,
    group: shift.group,
    spec: shift.spec,
    val: shift.val,
    date: shift.date,
    hours: shift.hours,
    loc: shift.loc,
    dist: shift.dist,
    rawMsg: shift.rawMsg,
    score: shift.sc,
    ts: shift.ts,
    av: shift.av,
    sender: shift.sender,
    rivals: shift.rivals,
    ok: shift.ok,
    sc: shift.sc,
  };

  const { error } = await client.from('captures').upsert(
    {
      user_id: userId,
      offer_id: offerId,
      offer: offerPayload,
      source,
      session_id: sessionId || null,
    },
    { onConflict: 'user_id,offer_id' },
  );

  throwIfError(error, '/captures');

  return {
    ...shift,
    capturedAt: new Date().toISOString(),
    capturedAtISO: new Date().toISOString(),
  };
}

export async function deleteAllCapturesFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { error } = await client.from('captures').delete().eq('user_id', userId);
  throwIfError(error, '/captures/delete');
}

// ── Rejections ────────────────────────────────────────────────────────────────

export async function fetchRejectedFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { data, error } = await client
    .from('rejections')
    .select('offer_id, offer, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(error, '/rejections');

  return (data || []).map((row) => ({
    ...(row.offer || {}),
    id: row.offer_id,
    reason: row.reason,
    rejectedAt: row.created_at,
  }));
}

export async function rejectOfferToSupabase(shift, { sessionId, reason = 'not_match' } = {}) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const offerId = String(shift.id || `${Date.now()}`);
  const offerPayload = {
    id: shift.id,
    hospital: shift.hospital,
    group: shift.group,
    spec: shift.spec,
    val: shift.val,
    date: shift.date,
    hours: shift.hours,
    loc: shift.loc,
    dist: shift.dist,
    rawMsg: shift.rawMsg,
    score: shift.sc,
    ts: shift.ts,
    av: shift.av,
    sender: shift.sender,
    ok: shift.ok,
    sc: shift.sc,
  };

  const { error } = await client.from('rejections').upsert(
    {
      user_id: userId,
      offer_id: offerId,
      offer: offerPayload,
      reason,
      session_id: sessionId || null,
    },
    { onConflict: 'user_id,offer_id' },
  );

  throwIfError(error, '/rejections');

  return shift;
}

export async function deleteAllRejectionsFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { error } = await client.from('rejections').delete().eq('user_id', userId);
  throwIfError(error, '/rejections/delete');
}

// ── Preferences ───────────────────────────────────────────────────────────────

export async function fetchPreferencesFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { data, error } = await client
    .from('preferences')
    .select('preferences')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error, '/preferences');

  return data?.preferences || null;
}

export async function savePreferencesToSupabase(preferences) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { error } = await client
    .from('preferences')
    .upsert({ user_id: userId, preferences }, { onConflict: 'user_id' });

  throwIfError(error, '/preferences/save');
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function fetchGroupsFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { data, error } = await client
    .from('groups')
    .select('group_id, name, members, active, emoji')
    .eq('user_id', userId)
    .order('name');

  throwIfError(error, '/groups');

  if (!data || data.length === 0) {
    return null;
  }

  return data.map((row) => ({
    id: row.group_id,
    name: row.name,
    members: row.members,
    active: row.active,
    emoji: row.emoji || '🏥',
  }));
}

export async function saveGroupsToSupabase(groups) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  if (!Array.isArray(groups) || groups.length === 0) {
    return;
  }

  const { error } = await client.from('groups').upsert(
    groups.map((group) => ({
      user_id: userId,
      group_id: String(group.id),
      name: group.name || 'Grupo',
      members: Number(group.members || 0),
      active: Boolean(group.active),
      emoji: group.emoji || '🏥',
    })),
    { onConflict: 'user_id,group_id' },
  );

  throwIfError(error, '/groups/save');
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export async function fetchMonitorStatusFromSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { data, error } = await client
    .from('monitor_sessions')
    .select('session_id, active, cursor')
    .eq('user_id', userId)
    .maybeSingle();

  throwIfError(error, '/monitor/status');

  return {
    active: Boolean(data?.active),
    sessionId: data?.session_id || null,
    cursor: data?.cursor || null,
  };
}

export async function startMonitoringInSupabase({ groups, prefs, operatorName }) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const sessionId = `local-${Date.now()}`;

  const { error } = await client.from('monitor_sessions').upsert(
    {
      user_id: userId,
      session_id: sessionId,
      active: true,
      cursor: null,
      groups: groups || [],
      preferences: prefs || {},
      operator_name: operatorName || '',
    },
    { onConflict: 'user_id' },
  );

  throwIfError(error, '/monitor/start');

  return { sessionId };
}

export async function stopMonitoringInSupabase() {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  const { error } = await client
    .from('monitor_sessions')
    .update({ active: false })
    .eq('user_id', userId);

  throwIfError(error, '/monitor/stop');
}

export async function fetchFeedFromSupabase({ cursor } = {}) {
  const client = getClientOrThrow();
  const userId = await getUserId(client);

  let query = client
    .from('whatsapp_messages')
    .select('id, group_name, sender_name, raw_text, is_offer, offer, received_at')
    .eq('user_id', userId)
    .order('received_at', { ascending: true })
    .limit(50);

  if (cursor) {
    query = query.gt('received_at', cursor);
  }

  const { data, error } = await query;
  throwIfError(error, '/monitor/feed');

  const items = (data || []).map((row) => {
    if (row.is_offer && row.offer) {
      return {
        ...row.offer,
        id: row.offer?.id || row.id,
        group: row.group_name || row.offer?.group || 'Grupo',
        sender: row.sender_name || row.offer?.sender || 'Sistema',
        rawMsg: row.raw_text || row.offer?.rawMsg || '',
        isOffer: true,
        state: 'done',
      };
    }

    return {
      id: row.id,
      group: row.group_name || 'Grupo',
      sender: row.sender_name || 'Sistema',
      rawMsg: row.raw_text || '',
      isOffer: false,
      state: 'done',
      ts: row.received_at,
    };
  });

  const nextCursor = data && data.length > 0 ? data[data.length - 1].received_at : null;

  return { items, cursor: nextCursor };
}
