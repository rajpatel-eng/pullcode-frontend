import { tokenStorage, refreshAccessToken } from './authService';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function safeParseError(res) {
  const raw = await res.text().catch(() => '');
  if (!raw) return { message: 'Request failed' };
  try { return JSON.parse(raw); } catch { return { message: raw }; }
}

async function safeParseSuccess(res) {
  const raw = await res.text().catch(() => '');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function authFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const buildHeaders = (token) => {
    const h = { Authorization: `Bearer ${token}` };
    if (!isFormData) h['Content-Type'] = 'application/json';
    return h;
  };
  const doFetch = (token) =>
    fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...buildHeaders(token), ...(options.headers || {}) },
    });

  let res = await doFetch(tokenStorage.getAccess());
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await doFetch(tokenStorage.getAccess());
    } catch (_) {
      tokenStorage.clear();
      window.location.href = '/user/login';
      throw new Error('Session expired');
    }
  }
  if (!res.ok) {
    const err = await safeParseError(res);
    throw new Error(err.message || err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return safeParseSuccess(res);
}

// ── Repository API ─────────────────────────────────────────────────────────────

export const getMyRepositories = () =>
  authFetch('/api/repositories');

export const getRepository = (id) =>
  authFetch(`/api/repositories/${id}`);

export const addRepository = (data) =>
  authFetch('/api/repositories', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteRepository = (id) =>
  authFetch(`/api/repositories/${id}`, { method: 'DELETE' });

export const updateAccessToken = (id, accessToken) =>
  authFetch(`/api/repositories/${id}/token`, {
    method: 'PATCH',
    body: JSON.stringify({ accessToken }),
  });

export const updateAiModel = (id, aiModelId) =>
  authFetch(`/api/repositories/${id}/ai-model`, {
    method: 'PATCH',
    body: JSON.stringify({ aiModelId }),
  });
