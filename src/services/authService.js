/**
 * src/services/authService.js
 *
 * Token storage + all auth API calls (login, register, OTP, refresh, logout).
 *
 * NOTE: Token refresh on 401 is handled automatically by the Axios interceptor
 * in api.js — these functions are only for explicit auth actions.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ── Storage key constants (exported so api.js can write tokens on refresh) ────
export const TOKEN_KEYS = {
  ACCESS:  'pc_access_token',
  REFRESH: 'pc_refresh_token',
  ROLE:    'pc_user_role',
  EMAIL:   'pc_user_email',
};

// ── Token storage helpers ─────────────────────────────────────────────────────
export const tokenStorage = {
  save(accessToken, refreshToken, email, role) {
    localStorage.setItem(TOKEN_KEYS.ACCESS,  accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    localStorage.setItem(TOKEN_KEYS.EMAIL,   email  || '');
    localStorage.setItem(TOKEN_KEYS.ROLE,    role   || '');
  },
  clear() {
    Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
  },
  getAccess()  { return localStorage.getItem(TOKEN_KEYS.ACCESS);  },
  getRefresh() { return localStorage.getItem(TOKEN_KEYS.REFRESH); },
  getRole()    { return localStorage.getItem(TOKEN_KEYS.ROLE);    },
  getEmail()   { return localStorage.getItem(TOKEN_KEYS.EMAIL);   },
  isLoggedIn() { return !!localStorage.getItem(TOKEN_KEYS.ACCESS); },
};

// ── Sentinel error string used by UserContext ─────────────────────────────────
export const SESSION_EXPIRED_ERROR = 'SESSION_EXPIRED';

// ── Raw axios instance for public auth calls (no interceptor loop risk) ───────
const authAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function extractError(err) {
  const d = err?.response?.data;
  return new Error(d?.message || d?.error || err?.message || 'Request failed');
}

// ── Normal user: email + password login ──────────────────────────────────────
export async function userLogin(email, password) {
  try {
    const { data } = await authAxios.post('/api/auth/login', { email, password });
    tokenStorage.save(data.accessToken, data.refreshToken, data.email, 'user');
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── Normal user: OTP + registration ──────────────────────────────────────────
export async function userSendOtp(email) {
  try {
    const { data } = await authAxios.post('/api/auth/send-otp', { email });
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

export async function userRegister(name, email, password, otp) {
  try {
    const { data } = await authAxios.post('/api/auth/register', { name, email, password, otp });
    tokenStorage.save(data.accessToken, data.refreshToken, data.email, 'user');
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── OAuth (Google / GitHub) ───────────────────────────────────────────────────
export function initiateGoogleLogin() {
  window.location.href = `${BASE_URL}/oauth2/authorize/google?redirect_uri=${encodeURIComponent(window.location.origin + '/login-success')}`;
}

export function initiateGithubLogin() {
  window.location.href = `${BASE_URL}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(window.location.origin + '/login-success')}`;
}

export function handleOAuthCallback() {
  const params       = new URLSearchParams(window.location.search);
  const accessToken  = params.get('token');
  const refreshToken = params.get('refreshToken');
  const email        = params.get('email');

  if (accessToken && refreshToken) {
    tokenStorage.save(accessToken, refreshToken, email || '', 'user');
    return true;
  }
  return false;
}

// ── Admin / IAM: step 1 — email + password → preAuthToken ────────────────────
export async function adminLogin(email, password) {
  try {
    const { data } = await authAxios.post('/api/admin/auth/login', { email, password });
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── Admin / IAM: step 2 — verify OTP → full JWT ──────────────────────────────
export async function adminVerifyOtp(preAuthToken, otp, role = 'admin') {
  try {
    const { data } = await authAxios.post('/api/admin/auth/verify-otp', { preAuthToken, otp });
    tokenStorage.save(data.accessToken, data.refreshToken, data.email, role);
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── Refresh (called directly only from api.js interceptor, but exported
//    so legacy code still compiles) ───────────────────────────────────────────
export async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  try {
    const { data } = await authAxios.post('/api/auth/refresh', { refreshToken });
    localStorage.setItem(TOKEN_KEYS.ACCESS, data.accessToken);
    if (data.refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, data.refreshToken);
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── Forgot password ───────────────────────────────────────────────────────────
export async function forgotPasswordSendOtp(email) {
  try {
    const { data } = await authAxios.post('/api/auth/forgot-password/send-otp', { email });
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

export async function forgotPasswordReset(email, otp, newPassword) {
  try {
    const { data } = await authAxios.post('/api/auth/forgot-password/reset', { email, otp, newPassword });
    return data;
  } catch (err) {
    throw extractError(err);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
// Calls the backend to invalidate the refresh token, then clears storage.
export async function logout() {
  try {
    const token = tokenStorage.getAccess();
    await authAxios.post(
      '/api/auth/logout',
      {},
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
  } catch (_) {
    // Ignore backend errors on logout — we clear local state regardless
  } finally {
    tokenStorage.clear();
  }
}

// ── Session-expired helper (used by UserContext) ──────────────────────────────
export function handleSessionExpired() {
  tokenStorage.clear();
  const isUser = window.location.pathname.startsWith('/user');
  window.location.replace(isUser ? '/user/login' : '/management/login');
}
