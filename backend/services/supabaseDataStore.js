import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createHttpError } from '../errors.js';

function createServiceClient(config) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createHttpError(500, 'SUPABASE_ENV_MISSING', 'Supabase service env vars are not configured.');
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

  throw createHttpError(status, 'DATA_STORE_ERROR', message || error.message || 'Data store operation failed.', {
    source: error,
  });
}

function nowIso() {
  return new Date().toISOString();
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

      const { error } = await client
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

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
      const { error } = await client
        .from('monitor_sessions')
        .upsert(
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

    async fetchFeed(_userId, { cursor }) {
      return {
        items: [],
        nextCursor: cursor || nowIso(),
      };
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
      const { error } = await client
        .from('captures')
        .delete()
        .eq('user_id', userId);

      assertNoError(error, 'Failed to clear captures.');
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
      const { error } = await client
        .from('rejections')
        .delete()
        .eq('user_id', userId);

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
      const { error } = await client
        .from('preferences')
        .upsert(
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
      const { error: deleteError } = await client
        .from('groups')
        .delete()
        .eq('user_id', userId);
      assertNoError(deleteError, 'Failed to clear groups before save.');

      if (!Array.isArray(groups) || groups.length === 0) {
        return;
      }

      const rows = groups.map((group, index) => ({
        user_id: userId,
        group_id: String(group.id || index + 1),
        name: String(group.name || `Grupo ${index + 1}`).slice(0, 120),
        members: Number(group.members || 0),
        active: Boolean(group.active),
        emoji: String(group.emoji || '🏥').slice(0, 24),
      }));

      const { error: insertError } = await client
        .from('groups')
        .insert(rows);
      assertNoError(insertError, 'Failed to save groups.');
    },

    async clearHistory(userId) {
      await Promise.all([
        this.clearCaptures(userId),
        this.clearRejections(userId),
      ]);
    },

    async trackEvent(userId, event) {
      const { error } = await client
        .from('events')
        .insert({
          user_id: userId,
          name: event.name,
          payload: event.payload,
          timestamp: event.timestamp,
        });

      assertNoError(error, 'Failed to persist event telemetry.');
    },
  };
}
