import { tokenStorage, refreshAccessToken } from './authService';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Safely reads a response body as text, then tries to parse JSON from it.
// This avoids the "Unexpected token 'P'" crash that happens when:
//   - res.json() is called on a plain-text body like "Password changed successfully."
//   - Spring returns a validation error without application/json content-type
async function safeParseError(res) {
  const raw = await res.text().catch(() => '');
  if (!raw) return { message: 'Request failed' };
  try {
    return JSON.parse(raw); // works if backend sent JSON
  } catch {
    return { message: raw }; // plain text — use as-is
  }
}

async function safeParseSuccess(res) {
  const raw = await res.text().catch(() => '');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // plain text like "Password changed successfully."
  }
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
      window.location.href = '/management/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    // Always read as text first, then try JSON parse — never call res.json() directly.
    // This handles ALL backend response formats: JSON errors, plain-text errors,
    // Spring validation errors, and empty bodies.
    const err = await safeParseError(res);
    throw new Error(err.message || err.error || 'Request failed');
  }

  if (res.status === 204) return null;

  return safeParseSuccess(res);
}

// ── Admin profile ─────────────────────────────────────────────────────────────
export const adminGetProfile = () =>
  authFetch('/api/admin/profile');

export const adminUpdateName = (name) =>
  authFetch('/api/admin/profile/name', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const adminChangePassword = (currentPassword, newPassword) =>
  authFetch('/api/admin/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
  });

export const adminUpdatePhoto = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return authFetch('/api/admin/profile/photo', { method: 'PATCH', body: fd });
};

// ── IAM profile ───────────────────────────────────────────────────────────────
export const iamGetProfile = () =>
  authFetch('/api/iam/profile');

export const iamChangePassword = (currentPassword, newPassword) =>
  authFetch('/api/iam/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
  });

export const iamUpdatePhoto = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return authFetch('/api/iam/profile/photo', { method: 'PATCH', body: fd });
};