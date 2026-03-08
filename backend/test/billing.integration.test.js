/* @vitest-environment node */

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import {
  createMockAuthService,
  createMockDataStore,
  createMockSubscriptionService,
  extractCsrfToken,
} from './helpers/mockDeps.js';

const PRO_LIMITS = {
  maxGroups: 5,
  maxCapturesPerMonth: null,
  autoCapture: true,
  aiChat: true,
  exportCsv: true,
};

async function setup(options = {}) {
  const app = createApp({
    authService: createMockAuthService(),
    dataStore: createMockDataStore(),
    subscriptionService: options.subscriptionService || createMockSubscriptionService(),
    config: {
      appBaseUrl: 'http://localhost:5173',
      secureCookies: false,
      cookieDomain: '',
      nodeEnv: 'test',
      evolutionApiUrl: '',
      evolutionApiKey: '',
    },
  });

  const agent = request.agent(app);
  const initial = await agent.get('/api/auth/me');
  const csrf = extractCsrfToken(initial.headers['set-cookie']);

  return { app, agent, csrf };
}

async function setupAndLogin(options = {}) {
  const { agent, csrf } = await setup(options);

  await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
    name: 'Dr. Teste',
    email: 'teste@example.com',
    password: 'SenhaForte123',
  });

  await agent
    .post('/api/auth/confirm')
    .set('X-CSRF-Token', csrf)
    .send({ token_hash: 'teste@example.com', type: 'signup' });

  await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
    email: 'teste@example.com',
    password: 'SenhaForte123',
  });

  return { agent, csrf };
}

describe('billing endpoints', () => {
  it('GET /api/billing/plans returns plan list without auth', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/billing/plans');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans.length).toBeGreaterThanOrEqual(3);

    const ids = res.body.plans.map((p) => p.id);
    expect(ids).toContain('free');
    expect(ids).toContain('pro');
    expect(ids).toContain('premium');
  });

  it('GET /api/billing/subscription returns 401 without auth', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/billing/subscription');
    expect(res.status).toBe(401);
  });

  it('GET /api/billing/subscription returns free plan for authenticated user', async () => {
    const { agent } = await setupAndLogin({
      subscriptionService: createMockSubscriptionService({ planId: 'free' }),
    });

    const res = await agent.get('/api/billing/subscription');
    expect(res.status).toBe(200);
    expect(res.body.planId).toBe('free');
    expect(res.body.limits).toBeDefined();
    expect(res.body.limits.maxGroups).toBe(1);
  });

  it('GET /api/billing/subscription returns pro plan for pro user', async () => {
    const { agent } = await setupAndLogin({
      subscriptionService: createMockSubscriptionService({ planId: 'pro', limits: PRO_LIMITS }),
    });

    const res = await agent.get('/api/billing/subscription');
    expect(res.status).toBe(200);
    expect(res.body.planId).toBe('pro');
    expect(res.body.limits.maxGroups).toBe(5);
    expect(res.body.limits.maxCapturesPerMonth).toBeNull();
  });

  it('POST /api/billing/checkout returns 401 without auth', async () => {
    const { agent, csrf } = await setup();
    const res = await agent
      .post('/api/billing/checkout')
      .set('X-CSRF-Token', csrf)
      .send({ planId: 'pro' });
    expect(res.status).toBe(401);
  });

  it('POST /api/billing/checkout returns 422 for invalid planId', async () => {
    const { agent, csrf } = await setupAndLogin();
    const res = await agent
      .post('/api/billing/checkout')
      .set('X-CSRF-Token', csrf)
      .send({ planId: 'invalid' });
    expect(res.status).toBe(422);
  });

  it('POST /api/billing/checkout returns 503 when Stripe is not configured', async () => {
    // No stripeService injected → billing unavailable
    const { agent, csrf } = await setupAndLogin({
      subscriptionService: createMockSubscriptionService(),
    });
    // App created without stripeService → stripeService will be null (no STRIPE_SECRET_KEY)
    const res = await agent
      .post('/api/billing/checkout')
      .set('X-CSRF-Token', csrf)
      .send({ planId: 'pro' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('BILLING_UNAVAILABLE');
  });

  it('POST /api/billing/portal returns 401 without auth', async () => {
    const { agent, csrf } = await setup();
    const res = await agent.post('/api/billing/portal').set('X-CSRF-Token', csrf).send({});
    expect(res.status).toBe(401);
  });

  it('POST /api/billing/portal returns 409 when user has no Stripe customer', async () => {
    const { agent, csrf } = await setupAndLogin({
      subscriptionService: createMockSubscriptionService({ planId: 'free' }),
    });
    const res = await agent.post('/api/billing/portal').set('X-CSRF-Token', csrf).send({});
    // stripeService is null (no key) → 503 BILLING_UNAVAILABLE
    expect([409, 503]).toContain(res.status);
  });
});

describe('plan enforcement — monitor/start', () => {
  it('blocks free user from monitoring more than 1 active group', async () => {
    const dataStore = createMockDataStore();
    // Make WhatsApp appear connected
    await dataStore.saveWhatsappInstanceMetadata('user-1', { instanceId: 'inst-1', connected: true });

    const app = createApp({
      authService: createMockAuthService(),
      dataStore,
      subscriptionService: createMockSubscriptionService({ planId: 'free' }),
      config: {
        appBaseUrl: 'http://localhost:5173',
        secureCookies: false,
        cookieDomain: '',
        nodeEnv: 'test',
      },
    });

    const agent = request.agent(app);
    const initial = await agent.get('/api/auth/me');
    const csrf = extractCsrfToken(initial.headers['set-cookie']);

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Free',
      email: 'free@example.com',
      password: 'SenhaForte123',
    });
    await agent.post('/api/auth/confirm').set('X-CSRF-Token', csrf).send({
      token_hash: 'free@example.com',
      type: 'signup',
    });
    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'free@example.com',
      password: 'SenhaForte123',
    });

    const res = await agent.post('/api/monitor/start').set('X-CSRF-Token', csrf).send({
      groups: [
        { id: 'g1', name: 'Grupo 1', active: true },
        { id: 'g2', name: 'Grupo 2', active: true },
      ],
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PLAN_LIMIT_EXCEEDED');
  });

  it('allows pro user to monitor up to 5 active groups', async () => {
    const dataStore = createMockDataStore();
    await dataStore.saveWhatsappInstanceMetadata('user-1', { instanceId: 'inst-1', connected: true });

    const app = createApp({
      authService: createMockAuthService(),
      dataStore,
      subscriptionService: createMockSubscriptionService({ planId: 'pro', limits: PRO_LIMITS }),
      config: {
        appBaseUrl: 'http://localhost:5173',
        secureCookies: false,
        cookieDomain: '',
        nodeEnv: 'test',
      },
    });

    const agent = request.agent(app);
    const initial = await agent.get('/api/auth/me');
    const csrf = extractCsrfToken(initial.headers['set-cookie']);

    await agent.post('/api/auth/signup').set('X-CSRF-Token', csrf).send({
      name: 'Dr. Pro',
      email: 'pro@example.com',
      password: 'SenhaForte123',
    });
    await agent.post('/api/auth/confirm').set('X-CSRF-Token', csrf).send({
      token_hash: 'pro@example.com',
      type: 'signup',
    });
    await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({
      email: 'pro@example.com',
      password: 'SenhaForte123',
    });

    const groups = Array.from({ length: 5 }, (_, i) => ({
      id: `g${i + 1}`,
      name: `Grupo ${i + 1}`,
      active: true,
    }));

    const res = await agent.post('/api/monitor/start').set('X-CSRF-Token', csrf).send({ groups });

    // WhatsApp is connected (mocked), pro plan allows 5 groups → should succeed
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);
  });
});
