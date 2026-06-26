/**
 * src/services/api.js
 *
 * Single Axios instance shared by every service.
 *
 * Features:
 *  - Attaches Bearer token to every request automatically
 *  - On 401 → tries a single token refresh, then retries the original request
 *  - Queues all concurrent 401s so only ONE refresh call is ever in flight
 *  - On refresh failure → clears storage and redirects to the right login page
 *  - Skips the Bearer header for public auth endpoints (login, register, refresh, OTP)
 *  - Always sends cookies (credentials: 'include') for OAuth / cookie-based fallback
 */

import axios from 'axios';
import { tokenStorage, TOKEN_KEYS } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ── Public paths that must NOT get the Bearer header ─────────────────────────
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-otp',
  '/api/auth/refresh',
  '/api/auth/forgot-password/send-otp',
  '/api/auth/forgot-password/reset',
  '/api/admin/auth/login',
  '/api/admin/auth/verify-otp',
];

const isPublic = (url = '') => PUBLIC_PATHS.some((p) => url.includes(p));

// ── Refresh-queue state ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = []; // callbacks waiting for the new access token

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach((cb) => cb(null));
  refreshSubscribers = [];
}

// ── Helper: redirect to correct login page ────────────────────────────────────
function redirectToLogin() {
  tokenStorage.clear();
  const isUserRoute = window.location.pathname.startsWith('/user');
  window.location.replace(isUserRoute ? '/user/login' : '/management/login');
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // always send cookies (HttpOnly cookie fallback)
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Authorization header ─────────────────────────
api.interceptors.request.use(
  (config) => {
    // Don't attach token for public endpoints
    if (isPublic(config.url)) return config;

    const token = tokenStorage.getAccess();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Let FormData set its own Content-Type (multipart boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 with token refresh ──────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401, and only once per request (_retry flag)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(normaliseError(error));
    }

    // Skip refresh for public endpoints (wrong credentials → just fail)
    if (isPublic(originalRequest.url)) {
      return Promise.reject(normaliseError(error));
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      // No refresh token at all → session is gone
      redirectToLogin();
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(new Error('SESSION_EXPIRED'));
            return;
          }
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    // We are the first 401 — kick off the refresh
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );

      const newAccess = data.accessToken;
      localStorage.setItem(TOKEN_KEYS.ACCESS, newAccess);
      if (data.refreshToken) {
        localStorage.setItem(TOKEN_KEYS.REFRESH, data.refreshToken);
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
      onTokenRefreshed(newAccess);
      isRefreshing = false;

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshFailed();
      redirectToLogin();
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }
  },
);

// ── Normalise Axios errors into plain Error objects ───────────────────────────
function normaliseError(error) {
  if (error?.response?.data) {
    const d = error.response.data;
    return new Error(d.message || d.error || `Request failed (${error.response.status})`);
  }
  return error instanceof Error ? error : new Error('Network error');
}

export default api;
