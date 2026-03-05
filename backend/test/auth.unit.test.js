/* @vitest-environment node */

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { normalizeAuthError } from '../errors.js';
import { createMockAuthService, createMockDataStore, extractCsrfToken } from './helpers/mockDeps.js';

async function buildAgent() {
  const app = createApp({
    authService: createMockAuthService(),
    dataStore: createMockDataStore(),
    config: {
      appBaseUrl: 'http://localhost:5173',
      secureCookies: false,
      cookieDomain: '',
      nodeEnv: 'test',
    },
  });

  const agent = request.agent(app);
  const me = await agent.get('/api/auth/me');
  const csrf = extractCsrfToken(me.headers['set-cookie']);

  return { app, agent, csrf };
}

describe('backend auth unit checks', () => {
  it('returns 422 for invalid signup payload', async () => {
    const { agent, csrf } = await buildAgent();

    const response = await agent
      .post('/api/auth/signup')
      .set('X-CSRF-Token', csrf)
      .send({ name: 'A', email: 'bad-email', password: '123' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects mutating routes without CSRF token', async () => {
    const { app } = await buildAgent();

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'User Name', email: 'user@example.com', password: '12345678' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CSRF_INVALID');
  });

  it('returns 401 on protected route without auth cookies', async () => {
    const { app } = await buildAgent();

    const response = await request(app).get('/api/captures');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('UNAUTHORIZED');
  });

  it('returns 403 for disallowed CORS origins', async () => {
    const { app } = await buildAgent();

    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('allows preflight for configured origin', async () => {
    const { app } = await buildAgent();

    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('normalizes auth service error classes', () => {
    expect(normalizeAuthError(new Error('Invalid login credentials')).status).toBe(401);
    expect(normalizeAuthError(new Error('Email not confirmed')).status).toBe(403);
    expect(normalizeAuthError(new Error('User already registered')).status).toBe(422);
  });
});
