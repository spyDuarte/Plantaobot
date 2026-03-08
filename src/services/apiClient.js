function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = rawBaseUrl.startsWith('http')
  ? trimTrailingSlash(rawBaseUrl)
  : trimTrailingSlash(rawBaseUrl.startsWith('/') ? rawBaseUrl : `/${rawBaseUrl}`);

const CSRF_COOKIE_NAME = 'pb_csrf';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfPrimePromise = null;

export class ApiError extends Error {
  constructor(message, { status, data, path } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.path = path;
  }
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = `${API_BASE_URL}${cleanPath}`;

  if (!query || Object.keys(query).length === 0) {
    return base;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null && item !== '') {
          params.append(key, String(item));
        }
      });
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function parseCookies() {
  if (typeof document === 'undefined') {
    return new Map();
  }

  const map = new Map();
  const raw = document.cookie || '';
  raw.split(';').forEach((chunk) => {
    const [rawKey, ...rawValue] = chunk.split('=');
    const key = rawKey?.trim();
    if (!key) {
      return;
    }

    map.set(key, decodeURIComponent(rawValue.join('=').trim()));
  });

  return map;
}

export function readCookie(name) {
  return parseCookies().get(name) || '';
}

export function getCsrfToken() {
  return readCookie(CSRF_COOKIE_NAME);
}

async function primeCsrfCookie() {
  if (typeof window === 'undefined') {
    return '';
  }

  const existing = getCsrfToken();
  if (existing) {
    return existing;
  }

  if (!csrfPrimePromise) {
    csrfPrimePromise = fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
      .catch(() => null)
      .finally(() => {
        csrfPrimePromise = null;
      });
  }

  await csrfPrimePromise;
  return getCsrfToken();
}

function shouldAttachJsonBody(body) {
  return body !== undefined && body !== null;
}

function buildHeaders({ method, headers, body, csrfToken }) {
  const next = {
    ...(headers || {}),
  };

  const lowerCaseHeaderNames = new Set(Object.keys(next).map((key) => key.toLowerCase()));

  if (shouldAttachJsonBody(body) && !lowerCaseHeaderNames.has('content-type')) {
    next['Content-Type'] = 'application/json';
  }

  if (csrfToken && MUTATING_METHODS.has(method) && !lowerCaseHeaderNames.has('x-csrf-token')) {
    next['X-CSRF-Token'] = csrfToken;
  }

  return next;
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function dispatchUnauthorized(path) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('pb-auth-unauthorized', {
      detail: { path },
    }),
  );
}

export async function apiRequest(path, options = {}) {
  const { method: rawMethod = 'GET', body, query, headers, signal } = options;

  const method = String(rawMethod).toUpperCase();
  const isMutating = MUTATING_METHODS.has(method);
  const csrfToken = isMutating ? getCsrfToken() || (await primeCsrfCookie()) : '';

  const url = buildUrl(path, query);
  const response = await fetch(url, {
    method,
    headers: buildHeaders({ method, headers, body, csrfToken }),
    body: shouldAttachJsonBody(body) ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'include',
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && !String(path).startsWith('/auth/')) {
      dispatchUnauthorized(path);
    }

    const message =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || `Request failed (${response.status})`;
    throw new ApiError(message, {
      status: response.status,
      data,
      path,
    });
  }

  return data;
}

export async function apiRequestOrNull(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
