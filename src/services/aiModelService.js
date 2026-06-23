import { tokenStorage, refreshAccessToken } from './authService';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function authFetch(path, options = {}) {
  const doFetch = (token) =>
    fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

  let res = await doFetch(tokenStorage.getAccess());

  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await doFetch(tokenStorage.getAccess());
    } catch (_) {
      tokenStorage.clear();
      window.location.href = '/management/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'AI model request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── AI Models ────────────────────────────────────────────────────────────────

export const listAiModels = (page = 0, size = 100) =>
  authFetch(`/api/models?page=${page}&size=${size}`);

export const getAiModel = (id) =>
  authFetch(`/api/models/${id}`);

export const createAiModel = (data) =>
  authFetch('/api/models', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// PUT /api/models/{id}  — updates name, provider, apiBaseUrl, systemPrompt, temperature, maxTokens, description
export const updateAiModel = (id, data) =>
  authFetch(`/api/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// PATCH /api/models/{id}/api-key  — rotates the encrypted API key
export const rotateAiModelApiKey = (id, newApiKey) =>
  authFetch(`/api/models/${id}/api-key`, {
    method: 'PATCH',
    body: JSON.stringify({ newApiKey }),
  });

export const pauseAiModel = (id) =>
  authFetch(`/api/models/${id}/pause`, { method: 'POST' });

export const resumeAiModel = (id) =>
  authFetch(`/api/models/${id}/resume`, { method: 'POST' });

export const setDefaultAiModel = (id) =>
  authFetch(`/api/models/${id}/set-default`, { method: 'POST' });

// DELETE soft-deletes; returns { affected, message }
export const deleteAiModel = (id) =>
  authFetch(`/api/models/${id}`, { method: 'DELETE' });