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
    throw new Error(err.message || 'Analytics request failed');
  }
  return res.json();
}

// ── System-level ──────────────────────────────────────────────────────────────
export const getSystemSummary = () =>
  authFetch('/api/analytics/summary');

export const getAllHealthStatuses = () =>
  authFetch('/api/analytics/health');

export const getAllAlerts = () =>
  authFetch('/api/analytics/alerts');

export const getAllRecommendations = () =>
  authFetch('/api/analytics/recommendations');

// ── Per-model ─────────────────────────────────────────────────────────────────
export const getModelDashboard       = (id) => authFetch(`/api/analytics/models/${id}/dashboard`);
export const getUsageMetrics         = (id) => authFetch(`/api/analytics/models/${id}/usage`);
export const getPerformanceMetrics   = (id) => authFetch(`/api/analytics/models/${id}/performance`);
export const getQualityMetrics       = (id) => authFetch(`/api/analytics/models/${id}/quality`);
export const getCostMetrics          = (id) => authFetch(`/api/analytics/models/${id}/cost`);
export const getAdoptionMetrics      = (id) => authFetch(`/api/analytics/models/${id}/adoption`);
export const getModelAlerts          = (id) => authFetch(`/api/analytics/models/${id}/alerts`);
export const getModelRecommendations = (id) => authFetch(`/api/analytics/models/${id}/recommendations`);
export const getModelHealth          = (id) => authFetch(`/api/analytics/models/${id}/health`);

export const getUsageTrend = (id, period = 'DAYS_30') =>
  authFetch(`/api/analytics/models/${id}/trends/usage?period=${period}`);
export const getCostTrend = (id, period = 'DAYS_30') =>
  authFetch(`/api/analytics/models/${id}/trends/cost?period=${period}`);
export const getPerformanceTrend = (id, period = 'DAYS_30') =>
  authFetch(`/api/analytics/models/${id}/trends/performance?period=${period}`);
export const getErrorTrend = (id, period = 'DAYS_30') =>
  authFetch(`/api/analytics/models/${id}/trends/errors?period=${period}`);

// ── Comparison ────────────────────────────────────────────────────────────────
export const compareModels = (modelIds, period = 'DAYS_30') =>
  authFetch(`/api/analytics/compare?period=${period}`, {
    method: 'POST',
    body: JSON.stringify({ modelIds }),
  });

// ── Alert resolve ─────────────────────────────────────────────────────────────
export const resolveAlert = (alertId) =>
  authFetch(`/api/analytics/alerts/${alertId}/resolve`, { method: 'POST' });

// ── AI Models list (for picking model IDs) ────────────────────────────────────
export const getAiModels = () =>
  authFetch('/api/models');
