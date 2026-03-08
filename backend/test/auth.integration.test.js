/* @vitest-environment node */

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import {
  createMockAuthService,
  createMockDataStore,
  extractCsrfToken,
} from './helpers/mockDeps.js';

async function setup(options = {}) {
  const app = createApp({
    authService: createMockAuthService(),
    dataStore: createMockDataStore(),
    whatsappProvider: options.whatsappProvider,
    config: {
      appBaseUrl: 'http://localhost:5173',
      secureCookies: false,
      cookieDomain: '',
      nodeEnv: 'test',
      evolutionApiUrl: options.evolutionApiUrl || '',
      evolutionApiKey: options.evolutionApiKey || '',
    },
  });

  const agent = request.agent(app);
  const initial = await agent.get('/api/auth/me');
  const csrf = extractCsrfToken(initial.headers['set-cookie']);

  return { app, agent, csrf };
}

function extractCookieValue(setCookieHeader, cookieName) {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const target = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!target) {
    return null;
  }

  return target.split(';')[0].split('=')[1];
}

describe('backend auth integration', () => {
  it('supports signup -> confirm -> login -> me -> logout', async () => {
    const { agent, csrf } = await setup();

    const signup = await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Maria',
      email: 'maria@example.com',
      password: 'SenhaForte123',
    });

    expect(signup.status).toBe(201);
    expect(signup.body.requiresEmailVerification).toBe(true);

    const loginBeforeConfirm = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'maria@example.com',
      password: 'SenhaForte123',
    });

    expect(loginBeforeConfirm.status).toBe(403);

    const confirm = await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'maria@example.com', type: 'signup' });

    expect(confirm.status).toBe(200);
    expect(confirm.body.emailVerified).toBe(true);

    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'maria@example.com',
      password: 'SenhaForte123',
    });

    expect(login.status).toBe(200);
    expect(login.body.emailVerified).toBe(true);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('maria@example.com');

    const logout = await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf).send({});

    expect(logout.status).toBe(204);

    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });

  it('refreshes session from refresh cookie when access token is stale', async () => {
    const { app, agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Bruno',
      email: 'bruno@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'bruno@example.com', type: 'signup' });

    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'bruno@example.com',
      password: 'SenhaForte123',
    });

    const refreshToken = extractCookieValue(login.headers['set-cookie'], 'pb_rt');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`pb_at=expired-token`, `pb_rt=${refreshToken}`, `pb_csrf=${csrf}`]);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('bruno@example.com');
    expect(Array.isArray(response.headers['set-cookie'])).toBe(true);
    expect(response.headers['set-cookie'].some((cookie) => cookie.startsWith('pb_at='))).toBe(true);
  });

  it('runs forgot/recovery/reset password flow', async () => {
    const { agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dra. Lara',
      email: 'lara@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'lara@example.com', type: 'signup' });

    const forgot = await agent
      .post('/api/auth/forgot-password')
      .set('X-CSRF-Token', csrf)
      .send({ email: 'lara@example.com' });

    expect(forgot.status).toBe(200);

    const recovery = await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'lara@example.com', type: 'recovery' });

    expect(recovery.status).toBe(200);

    const reset = await agent
      .post('/api/auth/reset-password')
      .set('X-CSRF-Token', csrf)
      .send({ newPassword: 'NovaSenha123' });

    expect(reset.status).toBe(200);
    expect(reset.body.ok).toBe(true);

    await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf).send({});

    const loginWithOldPassword = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ email: 'lara@example.com', password: 'SenhaForte123' });

    expect(loginWithOldPassword.status).toBe(401);

    const loginWithNewPassword = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ email: 'lara@example.com', password: 'NovaSenha123' });

    expect(loginWithNewPassword.status).toBe(200);
  });

  it('keeps bootstrap-import idempotent', async () => {
    const { agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dra. Ana',
      email: 'ana@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'ana@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'ana@example.com',
      password: 'SenhaForte123',
    });

    const payload = {
      prefs: {
        minVal: 2000,
        maxDist: 20,
        days: ['Seg'],
        specs: ['UTI'],
        auto: true,
      },
      groups: [{ id: 1, name: 'Grupo Teste', members: 10, active: true, emoji: '🏥' }],
      captured: [{ id: 'capture-1', hospital: 'Hospital 1', val: 3000 }],
      rejected: [{ id: 'rejected-1', hospital: 'Hospital 2', val: 800 }],
    };

    const first = await agent
      .post('/api/auth/bootstrap-import')
      .set('X-CSRF-Token', csrf)
      .send(payload);

    expect(first.status).toBe(200);
    expect(first.body.imported).toBe(true);

    const second = await agent
      .post('/api/auth/bootstrap-import')
      .set('X-CSRF-Token', csrf)
      .send(payload);

    expect(second.status).toBe(200);
    expect(second.body.imported).toBe(false);
    expect(second.body.alreadyImported).toBe(true);
  });

  it('blocks monitor start when WhatsApp is not connected', async () => {
    const { agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dra. Bia',
      email: 'bia@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'bia@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'bia@example.com',
      password: 'SenhaForte123',
    });

    const response = await agent
      .post('/api/monitor/start')
      .set('X-CSRF-Token', csrf)
      .send({
        groups: [{ id: 'g1', name: 'Grupo 1', active: true, members: 10, emoji: '🏥' }],
        preferences: { minVal: 1500, maxDist: 20 },
        operatorName: 'Dra. Bia',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('WHATSAPP_NOT_CONNECTED');
  });

  it('connects WhatsApp and returns QR payload', async () => {
    const whatsappProvider = {
      async createInstanceForUser() {
        return { instanceId: 'user-user-1' };
      },
      async getInstanceQr() {
        return { qrCode: 'data:image/png;base64,abc123', state: 'connecting' };
      },
    };

    const { agent, csrf } = await setup({
      evolutionApiUrl: 'http://localhost:8081',
      evolutionApiKey: 'test-key',
      whatsappProvider,
    });

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. João',
      email: 'joao@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'joao@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'joao@example.com',
      password: 'SenhaForte123',
    });

    const response = await agent.post('/api/whatsapp/connect').set('X-CSRF-Token', csrf).send({});

    expect(response.status).toBe(200);
    expect(response.body.instanceId).toBe('user-user-1');
    expect(response.body.qrCode).toBe('data:image/png;base64,abc123');
    expect(response.body.state).toBe('connecting');
    expect(response.body.connected).toBe(false);
  });

  it('refreshes WhatsApp status from provider when requested', async () => {
    const whatsappProvider = {
      async createInstanceForUser() {
        return { instanceId: 'user-user-1' };
      },
      async getInstanceQr() {
        return { qrCode: null, state: 'connecting' };
      },
      async getInstanceConnectionStatus() {
        return {
          instanceId: 'user-user-1',
          connected: true,
          state: 'open',
          phoneNumber: '5511912345678',
        };
      },
    };

    const { agent, csrf } = await setup({
      evolutionApiUrl: 'http://localhost:8081',
      evolutionApiKey: 'test-key',
      whatsappProvider,
    });

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Leo',
      email: 'leo@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'leo@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'leo@example.com',
      password: 'SenhaForte123',
    });

    await agent.post('/api/whatsapp/connect').set('X-CSRF-Token', csrf).send({});

    const liveStatus = await agent.get('/api/whatsapp/status?refresh=1');
    expect(liveStatus.status).toBe(200);
    expect(liveStatus.body.connected).toBe(true);
    expect(liveStatus.body.phoneNumber).toBe('5511912345678');

    const persistedStatus = await agent.get('/api/whatsapp/status');
    expect(persistedStatus.status).toBe(200);
    expect(persistedStatus.body.connected).toBe(true);
    expect(persistedStatus.body.phoneNumber).toBe('5511912345678');
  });

  it('returns authenticated WhatsApp status and persists webhook status transitions', async () => {
    const { agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Caio',
      email: 'caio@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'caio@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'caio@example.com',
      password: 'SenhaForte123',
    });

    const waConfig = await agent.get('/api/whatsapp/config');

    const webhookConnected = await agent
      .post(`/api/whatsapp/webhook/${waConfig.body.userId}?token=${waConfig.body.webhookToken}`)
      .send({
        event: 'connection.update',
        instance: 'instance-caio',
        data: {
          state: 'open',
          number: '5511999999999',
        },
      });

    expect(webhookConnected.status).toBe(200);
    expect(webhookConnected.body.type).toBe('status');

    const statusConnected = await agent.get('/api/whatsapp/status');
    expect(statusConnected.status).toBe(200);
    expect(statusConnected.body.connected).toBe(true);
    expect(statusConnected.body.instanceId).toBe('instance-caio');
    expect(statusConnected.body.phoneNumber).toBe('5511999999999');
    expect(statusConnected.body.connectedAt).toBeTruthy();

    const webhookDisconnected = await agent
      .post(`/api/whatsapp/webhook/${waConfig.body.userId}?token=${waConfig.body.webhookToken}`)
      .send({
        event: 'connection.update',
        instance: 'instance-caio',
        data: {
          state: 'close',
          number: '5511999999999',
        },
      });

    expect(webhookDisconnected.status).toBe(200);

    const statusDisconnected = await agent.get('/api/whatsapp/status');
    expect(statusDisconnected.status).toBe(200);
    expect(statusDisconnected.body.connected).toBe(false);
    expect(statusDisconnected.body.connectedAt).toBeNull();
    expect(statusDisconnected.body.instanceId).toBe('instance-caio');
    expect(statusDisconnected.body.phoneNumber).toBe('5511999999999');
  });

  it('drops group messages from inactive groups without persisting', async () => {
    const { agent, csrf } = await setup();

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Ivo',
      email: 'ivo@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'ivo@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'ivo@example.com',
      password: 'SenhaForte123',
    });

    const waConfig = await agent.get('/api/whatsapp/config');

    await agent
      .put('/api/groups')
      .set('X-CSRF-Token', csrf)
      .send({
        groups: [
          {
            id: '120363999999999999@g.us',
            name: 'Grupo Bloqueado',
            members: 10,
            emoji: '🏥',
            active: false,
          },
        ],
      });

    const webhookResponse = await agent
      .post(`/api/whatsapp/webhook/${waConfig.body.userId}?token=${waConfig.body.webhookToken}`)
      .send({
        event: 'messages.upsert',
        data: {
          key: {
            remoteJid: '120363999999999999@g.us',
            id: 'msg-inactive-1',
          },
          pushName: 'Dr. Sender',
          message: {
            conversation: 'Plantão amanhã 12h',
          },
          messageTimestamp: String(Math.floor(Date.now() / 1000)),
        },
      });

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ ok: true, processed: false, reason: 'inactive_group' });

    const feedResponse = await agent.get('/api/monitor/feed');
    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body.items).toHaveLength(0);
  });

  it('syncs WhatsApp groups preserving active flag from existing groups', async () => {
    const whatsappProvider = {
      async createInstanceForUser() {
        return { instanceId: 'user-user-1' };
      },
      async getInstanceQr() {
        return { qrCode: null, state: 'connecting' };
      },
      async listInstanceGroups() {
        return [
          { id: '1203630@g.us', name: 'Plantão UTI', members: 145, emoji: '🏥', active: true },
          { id: '1203631@g.us', name: 'Clínica Geral', members: 89, emoji: '🏥', active: true },
        ];
      },
    };

    const { agent, csrf } = await setup({
      evolutionApiUrl: 'http://localhost:8081',
      evolutionApiKey: 'test-key',
      whatsappProvider,
    });

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Rafaela',
      email: 'rafaela@example.com',
      password: 'SenhaForte123',
    });

    await agent
      .post('/api/auth/confirm')
      .set('X-CSRF-Token', csrf)
      .send({ token_hash: 'rafaela@example.com', type: 'signup' });

    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'rafaela@example.com',
      password: 'SenhaForte123',
    });

    await agent.post('/api/whatsapp/connect').set('X-CSRF-Token', csrf).send({});

    await agent
      .put('/api/groups')
      .set('X-CSRF-Token', csrf)
      .send({
        groups: [
          { id: '1203630@g.us', name: 'Plantão UTI', members: 120, emoji: '🏥', active: false },
        ],
      });

    const syncResponse = await agent.get('/api/whatsapp/groups');

    expect(syncResponse.status).toBe(200);
    expect(syncResponse.body.groups).toEqual([
      { id: '1203630@g.us', name: 'Plantão UTI', members: 145, emoji: '🏥', active: false },
      { id: '1203631@g.us', name: 'Clínica Geral', members: 89, emoji: '🏥', active: true },
    ]);
  });
});
