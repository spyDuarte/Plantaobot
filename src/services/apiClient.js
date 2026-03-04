function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
export const API_BASE_URL = rawBaseUrl.startsWith("http")
  ? trimTrailingSlash(rawBaseUrl)
  : trimTrailingSlash(rawBaseUrl.startsWith("/") ? rawBaseUrl : `/${rawBaseUrl}`);

export class ApiError extends Error {
  constructor(message, { status, data, path } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.path = path;
  }
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${API_BASE_URL}${cleanPath}`;

  if (!query || Object.keys(query).length === 0) {
    return base;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null && item !== "") {
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

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    query,
    headers,
    signal,
  } = options;

  const url = buildUrl(path, query);
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body == null ? undefined : JSON.stringify(body),
    signal,
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
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
