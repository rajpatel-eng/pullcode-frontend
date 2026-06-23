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
    throw new Error(err.message || err.error || 'IAM request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── IAM Management ───────────────────────────────────────────────────────────
export const listIamUsers = (page = 0, size = 100) =>
  authFetch(`/api/admin/iam?page=${page}&size=${size}`);

export const getIamUser = (id) =>
  authFetch(`/api/admin/iam/${id}`);

export const createIamUser = (data) =>
  authFetch('/api/admin/iam', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateIamName = (id, name) =>
  authFetch(`/api/admin/iam/${id}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const updateIamEmail = (id, email) =>
  authFetch(`/api/admin/iam/${id}/email`, {
    method: 'PATCH',
    body: JSON.stringify({ email }),
  });

export const resetIamPassword = (id, newPassword) =>
  authFetch(`/api/admin/iam/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  });

export const pauseIamUser = (id) =>
  authFetch(`/api/admin/iam/${id}/pause`, { method: 'POST' });

export const resumeIamUser = (id) =>
  authFetch(`/api/admin/iam/${id}/resume`, { method: 'POST' });

export const deleteIamUser = (id) =>
  authFetch(`/api/admin/iam/${id}`, { method: 'DELETE' });
