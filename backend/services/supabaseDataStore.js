import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createHttpError } from '../errors.js';

function createServiceClient(config) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createHttpError(
      500,
      'SUPABASE_ENV_MISSING',
      'Supabase service env vars are not configured.',
    );
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function assertNoError(error, message, { status = 500 } = {}) {
  if (!error) {
    return;
  }

  throw createHttpError(
    status,
    'DATA_STORE_ERROR',
    message || error.message || 'Data store operation failed.',
    {
      source: error,
    },
  );
}

function nowIso() {
  return new Date().toISOString();
}

function toCanonicalGroupId(group, fallbackId) {
  const jid = String(group?.jid || '')
    .trim()
    .toLowerCase();
  if (jid && jid.endsWith('@g.us')) {
    return jid;
  }

  const id = String(group?.id || '')
    .trim()
    .toLowerCase();
  if (id && id.endsWith('@g.us')) {
    return id;
  }

  return String(group?.id || fallbackId || '').trim();
}

function normalizeOffer(offer, fallbackId) {
  const id = String(offer?.id || fallbackId || crypto.randomUUID());
  return {
    ...offer,
    id,
  };
}

export function createSupabaseDataStore(config) {
  const client = createServiceClient(config);

  return {
    async ensureProfile({ userId, name }) {
      const payload = {
        id: userId,
        updated_at: nowIso(),
      };

      if (name) {
        payload.name = String(name).slice(0, 80);
      }

      const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });

      assertNoError(error, 'Failed to upsert profile.');
    },

    async getProfile(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('id, name, bootstrap_imported_at, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      assertNoError(error, 'Failed to fetch profile.');

      if (data) {
        return data;
      }

      await this.ensureProfile({ userId });

      return {
        id: userId,
        name: null,
        bootstrap_imported_at: null,
      };
    },

    async bootstrapImport({ userId, prefs, groups, captured, rejected, profileName }) {
      const profile = await this.getProfile(userId);
      if (profile.bootstrap_imported_at) {
        return {
          imported: false,
          alreadyImported: true,
        };
      }

      await this.ensureProfile({ userId, name: profileName || profile.name });
      await this.savePreferences(userId, prefs || {});
      await this.saveGroups(userId, groups || []);

      await client.from('captures').delete().eq('user_id', userId);
      await client.from('rejections').delete().eq('user_id', userId);

      if (Array.isArray(captured) && captured.length > 0) {
        const rows = captured.map((offer) => {
          const normalizedOffer = normalizeOffer(offer);
          return {
            user_id: userId,
            offer_id: normalizedOffer.id,
            offer: normalizedOffer,
            source: 'bootstrap',
            session_id: 'bootstrap',
          };
        });

        const { error: captureError } = await client
          .from('captures')
          .upsert(rows, { onConflict: 'user_id,offer_id' });
        assertNoError(captureError, 'Failed to bootstrap captures.');
      }

      if (Array.isArray(rejected) && rejected.length > 0) {
        const rows = rejected.map((offer) => {
          const normalizedOffer = normalizeOffer(offer);
          return {
            user_id: userId,
            offer_id: normalizedOffer.id,
            offer: normalizedOffer,
            reason: 'bootstrap',
            session_id: 'bootstrap',
          };
        });

        const { error: rejectionError } = await client
          .from('rejections')
          .upsert(rows, { onConflict: 'user_id,offer_id' });
        assertNoError(rejectionError, 'Failed to bootstrap rejections.');
      }

      const importedAt = nowIso();
      const { error: profileError } = await client
        .from('profiles')
        .update({ bootstrap_imported_at: importedAt, updated_at: importedAt })
        .eq('id', userId);
      assertNoError(profileError, 'Failed to mark bootstrap as imported.');

      return {
        imported: true,
        alreadyImported: false,
        importedAt,
        counts: {
          groups: groups?.length || 0,
          captured: captured?.length || 0,
          rejected: rejected?.length || 0,
        },
      };
    },

    async getMonitorStatus(userId) {
      const { data, error } = await client
        .from('monitor_sessions')
        .select('session_id, active')
        .eq('user_id', userId)
        .maybeSingle();

      assertNoError(error, 'Failed to fetch monitor status.');

      return {
        active: Boolean(data?.active),
        sessionId: data?.session_id || null,
      };
    },

    async startMonitoring(userId, { groups, preferences, operatorName }) {
      const sessionId = crypto.randomUUID();
      const { error } = await client.from('monitor_sessions').upsert(
        {
          user_id: userId,
          session_id: sessionId,
          active: true,
          groups,
          preferences,
          operator_name: operatorName,
          cursor: null,
          updated_at: nowIso(),
        },
        { onConflict: 'user_id' },
      );

      assertNoError(error, 'Failed to start monitor session.');

      return {
        sessionId,
      };
    },

    async stopMonitoring(userId, { sessionId }) {
      let query = client
        .from('monitor_sessions')
        .update({
          active: false,
          updated_at: nowIso(),
        })
        .eq('user_id', userId);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { error } = await query;
      assertNoError(error, 'Failed to stop monitor session.');
    },

    async fetchFeed(userId, { cursor }) {
      let query = client
        .from('whatsapp_messages')
        .select('id, message_id, group_name, sender_name, raw_text, is_offer, offer, received_at')
        .eq('user_id', userId)
        .order('received_at', { ascending: true })
        .limit(50);

      if (cursor) {
        query = query.gt('received_at', cursor);
      }

      const { data, error } = await query;
      assertNoError(error, 'Failed to fetch WhatsApp feed.');

      const rows = data || [];

      const items = rows.map((row) => {
        const ts = new Date(row.received_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        if (row.is_offer && row.offer) {
          return {
            ...row.offer,
            id: row.offer.id || row.id,
            group: row.offer.group || row.group_name || 'WhatsApp',
            sender: row.offer.sender || row.sender_name || 'Grupo',
            av: row.offer.av || (row.sender_name || 'W').charAt(0).toUpperCase(),
            ts,
            isOffer: true,
            state: 'done',
          };
        }

        return {
          id: row.id,
          group: row.group_name || 'WhatsApp',
          sender: row.sender_name || 'Desconhecido',
          av: (row.sender_name || 'W').charAt(0).toUpperCase(),
          rawMsg: row.raw_text,
          ts,
          isOffer: false,
          state: 'done',
        };
      });

      const nextCursor = rows.length > 0 ? rows[rows.length - 1].received_at : cursor || nowIso();

      return { items, nextCursor };
    },

    async getWhatsappConfig(userId) {
      const { data, error } = await client
        .from('whatsapp_config')
        .select('user_id, webhook_token, instance_id, phone_number, connected, connected_at')
        .eq('user_id', userId)
        .maybeSingle();

      assertNoError(error, 'Failed to fetch WhatsApp config.');

      if (!data) {
        return this.ensureWhatsappConfig(userId);
      }

      return {
        userId: data.user_id,
        webhookToken: data.webhook_token,
        instanceId: data.instance_id || null,
        phoneNumber: data.phone_number || null,
        connected: Boolean(data.connected),
        connectedAt: data.connected_at || null,
      };
    },

    async getWhatsappStatus(userId) {
      const config = await this.getWhatsappConfig(userId);

      return {
        connected: Boolean(config.connected),
        connectedAt: config.connectedAt || null,
        instanceId: config.instanceId || null,
        phoneNumber: config.phoneNumber || null,
      };
    },

    async ensureWhatsappConfig(userId) {
      const token = crypto.randomUUID();

      const { data, error } = await client
        .from('whatsapp_config')
        .upsert(
          {
            user_id: userId,
            webhook_token: token,
            updated_at: nowIso(),
          },
          { onConflict: 'user_id', ignoreDuplicates: true },
        )
        .select('user_id, webhook_token, instance_id, phone_number, connected, connected_at')
        .maybeSingle();

      assertNoError(error, 'Failed to create WhatsApp config.');

      if (data) {
        return {
          userId: data.user_id,
          webhookToken: data.webhook_token,
          instanceId: data.instance_id || null,
          phoneNumber: data.phone_number || null,
          connected: Boolean(data.connected),
          connectedAt: data.connected_at || null,
        };
      }

      // Row already existed; fetch it
      return this.getWhatsappConfig(userId);
    },

    async validateWebhookToken(userId, token) {
      if (!userId || !token) {
        return false;
      }

      const { data, error } = await client
        .from('whatsapp_config')
        .select('webhook_token')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return data.webhook_token === token;
    },

    async resetWebhookToken(userId) {
      const newToken = crypto.randomUUID();

      const { error } = await client.from('whatsapp_config').upsert(
        {
          user_id: userId,
          webhook_token: newToken,
          updated_at: nowIso(),
        },
        { onConflict: 'user_id' },
      );

      assertNoError(error, 'Failed to reset webhook token.');

      return { webhookToken: newToken };
    },

    async saveWhatsappInstanceMetadata(userId, { instanceId, connected = false }) {
      const now = nowIso();
      const payload = {
        user_id: userId,
        instance_id: instanceId || null,
        connected: Boolean(connected),
        connected_at: connected ? now : null,
        updated_at: now,
      };

      const { error } = await client
        .from('whatsapp_config')
        .upsert(payload, { onConflict: 'user_id' });

      assertNoError(error, 'Failed to persist WhatsApp instance metadata.');
    },

    async saveWhatsappStatusTransition(
      userId,
      { connected, instanceId = null, phoneNumber = null },
    ) {
      const now = nowIso();
      const payload = {
        user_id: userId,
        connected: Boolean(connected),
        connected_at: connected ? now : null,
        updated_at: now,
      };

      if (instanceId !== null) {
        payload.instance_id = String(instanceId);
      }

      if (phoneNumber !== null) {
        payload.phone_number = String(phoneNumber);
      }

      const { error } = await client
        .from('whatsapp_config')
        .upsert(payload, { onConflict: 'user_id' });

      assertNoError(error, 'Failed to persist WhatsApp status transition.');
    },

    async saveWhatsappMessage(
      userId,
      { messageId, jid, groupName, senderName, rawText, isOffer, offer, receivedAt },
    ) {
      const row = {
        user_id: userId,
        message_id: messageId || null,
        jid: jid || null,
        group_name: groupName || null,
        sender_name: senderName || null,
        raw_text: String(rawText).slice(0, 4000),
        is_offer: Boolean(isOffer),
        offer: offer || null,
        received_at: receivedAt || nowIso(),
      };

      const { error } = await client
        .from('whatsapp_messages')
        .upsert(row, { onConflict: 'user_id,message_id', ignoreDuplicates: true });

      assertNoError(error, 'Failed to persist WhatsApp message.');
    },

    async getWhatsappMessageCount(userId) {
      const { count, error } = await client
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      assertNoError(error, 'Failed to count WhatsApp messages.');

      return count || 0;
    },

    async listCaptures(userId) {
      const { data, error } = await client
        .from('captures')
        .select('offer_id, offer, source, session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500);

      assertNoError(error, 'Failed to list captures.');

      return (data || []).map((row) => ({
        ...row.offer,
        id: row.offer?.id || row.offer_id,
        source: row.source,
        sessionId: row.session_id,
        capturedAt: row.created_at,
      }));
    },

    async addCapture(userId, { sessionId, source, offer }) {
      const normalizedOffer = normalizeOffer(offer);

      const row = {
        user_id: userId,
        offer_id: normalizedOffer.id,
        offer: normalizedOffer,
        source: source || 'manual',
        session_id: sessionId || null,
      };

      const { error } = await client
        .from('captures')
        .upsert(row, { onConflict: 'user_id,offer_id' });
      assertNoError(error, 'Failed to persist capture.');

      return {
        ...normalizedOffer,
        capturedAt: nowIso(),
      };
    },

    async clearCaptures(userId) {
      const { error } = await client.from('captures').delete().eq('user_id', userId);

      assertNoError(error, 'Failed to clear captures.');
    },

    async countCapturesSince(userId, since) {
      const { count, error } = await client
        .from('captures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since);

      assertNoError(error, 'Failed to count captures.');
      return count ?? 0;
    },

    async listRejections(userId) {
      const { data, error } = await client
        .from('rejections')
        .select('offer_id, offer, reason, session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500);

      assertNoError(error, 'Failed to list rejections.');

      return (data || []).map((row) => ({
        ...row.offer,
        id: row.offer?.id || row.offer_id,
        reason: row.reason,
        sessionId: row.session_id,
        createdAt: row.created_at,
      }));
    },

    async addRejection(userId, { sessionId, reason, offer }) {
      const normalizedOffer = normalizeOffer(offer);

      const row = {
        user_id: userId,
        offer_id: normalizedOffer.id,
        offer: normalizedOffer,
        reason: reason || 'manual_reject',
        session_id: sessionId || null,
      };

      const { error } = await client
        .from('rejections')
        .upsert(row, { onConflict: 'user_id,offer_id' });
      assertNoError(error, 'Failed to persist rejection.');

      return {
        ...normalizedOffer,
        reason: row.reason,
      };
    },

    async clearRejections(userId) {
      const { error } = await client.from('rejections').delete().eq('user_id', userId);

      assertNoError(error, 'Failed to clear rejections.');
    },

    async getPreferences(userId) {
      const { data, error } = await client
        .from('preferences')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();

      assertNoError(error, 'Failed to fetch preferences.');

      return data?.preferences || null;
    },

    async savePreferences(userId, preferences) {
      const { error } = await client.from('preferences').upsert(
        {
          user_id: userId,
          preferences,
          updated_at: nowIso(),
        },
        { onConflict: 'user_id' },
      );

      assertNoError(error, 'Failed to save preferences.');
    },

    async getGroups(userId) {
      const { data, error } = await client
        .from('groups')
        .select('group_id, name, members, active, emoji')
        .eq('user_id', userId)
        .order('group_id', { ascending: true });

      assertNoError(error, 'Failed to fetch groups.');

      return (data || []).map((group) => ({
        id: group.group_id,
        name: group.name,
        members: Number(group.members || 0),
        active: Boolean(group.active),
        emoji: group.emoji || '🏥',
      }));
    },

    async saveGroups(userId, groups) {
      const { error: deleteError } = await client.from('groups').delete().eq('user_id', userId);
      assertNoError(deleteError, 'Failed to clear groups before save.');

      if (!Array.isArray(groups) || groups.length === 0) {
        return;
      }

      const rows = groups.map((group, index) => ({
        user_id: userId,
        group_id: toCanonicalGroupId(group, index + 1),
        name: String(group.name || `Grupo ${index + 1}`).slice(0, 120),
        members: Number(group.members || 0),
        active: Boolean(group.active),
        emoji: String(group.emoji || '🏥').slice(0, 24),
      }));

      const { error: insertError } = await client.from('groups').insert(rows);
      assertNoError(insertError, 'Failed to save groups.');
    },

    async mergeGroups(userId, groups) {
      if (!Array.isArray(groups) || groups.length === 0) {
        return this.getGroups(userId);
      }

      const normalizedGroups = groups.map((group, index) => ({
        id: toCanonicalGroupId(group, index + 1),
        name: String(group.name || `Grupo ${index + 1}`).slice(0, 120),
        members: Number(group.members || 0),
        emoji: String(group.emoji || '🏥').slice(0, 24),
        active: Boolean(group.active),
      }));

      const groupIds = normalizedGroups.map((group) => group.id);

      const { data: existingRows, error: existingError } = await client
        .from('groups')
        .select('group_id, active')
        .eq('user_id', userId)
        .in('group_id', groupIds);
      assertNoError(existingError, 'Failed to fetch existing groups before merge.');

      const activeByGroupId = new Map(
        (existingRows || []).map((row) => [row.group_id, Boolean(row.active)]),
      );

      const rows = normalizedGroups.map((group) => ({
        user_id: userId,
        group_id: group.id,
        name: group.name,
        members: group.members,
        emoji: group.emoji,
        active: activeByGroupId.has(group.id) ? activeByGroupId.get(group.id) : group.active,
        updated_at: nowIso(),
      }));

      const { error: upsertError } = await client
        .from('groups')
        .upsert(rows, { onConflict: 'user_id,group_id' });
      assertNoError(upsertError, 'Failed to merge groups.');

      return this.getGroups(userId);
    },

    async isActiveGroupByJidOrName(userId, { jid, groupName } = {}) {
      const normalizedJid = String(jid || '')
        .trim()
        .toLowerCase();
      const normalizedGroupName = String(groupName || '')
        .trim()
        .toLowerCase();

      if (!normalizedJid && !normalizedGroupName) {
        return false;
      }

      let query = client
        .from('groups')
        .select('group_id, name, active')
        .eq('user_id', userId)
        .limit(50);

      if (normalizedJid && normalizedGroupName) {
        query = query.or(`group_id.eq.${normalizedJid},name.ilike.${normalizedGroupName}`);
      } else if (normalizedJid) {
        query = query.eq('group_id', normalizedJid);
      } else {
        query = query.ilike('name', normalizedGroupName);
      }

      const { data, error } = await query;
      assertNoError(error, 'Failed to validate active group by jid or name.');

      return (data || []).some((group) => Boolean(group.active));
    },

    async clearHistory(userId) {
      await Promise.all([this.clearCaptures(userId), this.clearRejections(userId)]);
    },

    async trackEvent(userId, event) {
      const { error } = await client.from('events').insert({
        user_id: userId,
        name: event.name,
        payload: event.payload,
        timestamp: event.timestamp,
      });

      assertNoError(error, 'Failed to persist event telemetry.');
    },
  };
}
