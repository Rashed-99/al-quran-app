const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Access token lives in memory only (not localStorage) to reduce XSS
// exfiltration risk. It's lost on hard refresh by design - httpClient
// transparently recovers it via the httpOnly refresh cookie on the next
// request (see ensureAccessToken below). AuthContext also proactively
// calls /auth/refresh once on app load.
let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function rawRequest(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include', // send/receive the httpOnly refresh cookie
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST', skipAuth: true })
      .then((data) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Main request helper. On a 401 (expired/missing access token), attempts
 * exactly one silent refresh-and-retry before giving up - mirrors the
 * transparent session continuity the Base44 SDK used to provide.
 */
export async function request(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    if (err.status === 401 && !options.skipAuth && !options._retried) {
      try {
        await refreshAccessToken();
        return await rawRequest(path, { ...options, _retried: true });
      } catch (refreshErr) {
        setAccessToken(null);
        throw err; // surface the original 401 - caller/AuthContext decides what to do
      }
    }
    throw err;
  }
}

export const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  refreshAccessToken,
};

export default httpClient;
