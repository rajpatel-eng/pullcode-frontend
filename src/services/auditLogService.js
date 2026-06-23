import { tokenStorage, refreshAccessToken } from './authService';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Auto-refresh on 401
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
    throw new Error(err.message || 'Audit log request failed');
  }
  return res.json();
}

// ── Audit Logs ──────────────────────────────────────────────────────────────
// params: { action, actorId, entityType, entityId, from, to, page, size, sort }
export const getAuditLogs = (params = {}) => {
  const query = new URLSearchParams();

  if (params.action) query.set('action', params.action);
  if (params.actorId) query.set('actorId', params.actorId);
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  query.set('page', params.page ?? 0);
  query.set('size', params.size ?? 30);
  query.set('sort', params.sort || 'createdAt,desc');

  return authFetch(`/api/admin/audit-logs?${query.toString()}`);
};

export const getIamAuditActivity = (iamId, page = 0, size = 10) =>
  authFetch(`/api/admin/audit-logs/iam/${iamId}?page=${page}&size=${size}`);
