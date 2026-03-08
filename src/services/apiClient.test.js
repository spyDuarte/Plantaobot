import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './apiClient.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function clearCsrfCookie() {
  document.cookie = 'pb_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

describe('apiClient auth/csrf behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearCsrfCookie();
  });

  it('sends credentials include and csrf header for mutating requests', async () => {
    document.cookie = 'pb_csrf=test-csrf';

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiRequest('/captures', {
      method: 'POST',
      body: { hello: 'world' },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.credentials).toBe('include');
    expect(options.headers['X-CSRF-Token']).toBe('test-csrf');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('respects existing lowercase content-type and csrf headers', async () => {
    document.cookie = 'pb_csrf=test-csrf';

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiRequest('/captures', {
      method: 'POST',
      body: { hello: 'world' },
      headers: {
        'content-type': 'application/merge-patch+json',
        'x-csrf-token': 'custom-csrf',
      },
    });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers['content-type']).toBe('application/merge-patch+json');
    expect(options.headers['x-csrf-token']).toBe('custom-csrf');
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('primes csrf token via /auth/me when cookie is missing', async () => {
    clearCsrfCookie();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy
      .mockImplementationOnce(async () => {
        document.cookie = 'pb_csrf=fresh-csrf';
        return jsonResponse({ message: 'unauthorized' }, 401);
      })
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    await apiRequest('/events', {
      method: 'POST',
      body: { name: 'share_clicked' },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toContain('/auth/me');
    expect(fetchSpy.mock.calls[1][1].headers['X-CSRF-Token']).toBe('fresh-csrf');
  });

  it('dispatches unauthorized event for protected non-auth endpoints', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ message: 'Sessão inválida.' }, 401));

    const handler = vi.fn();
    window.addEventListener('pb-auth-unauthorized', handler);

    await expect(apiRequest('/monitor/status')).rejects.toBeInstanceOf(ApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener('pb-auth-unauthorized', handler);
  });

  it('maps html error payload to a friendly message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('<!DOCTYPE html><html><body>404</body></html>', {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      }),
    );

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      message: 'Serviço indisponível no momento. Tente novamente em alguns instantes.',
      status: 404,
    });
  });
});
