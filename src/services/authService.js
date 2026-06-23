const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const KEYS = {
  ACCESS:  'pc_access_token',
  REFRESH: 'pc_refresh_token',
  ROLE:    'pc_user_role',
  EMAIL:   'pc_user_email',
};

// ── Storage helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  save(accessToken, refreshToken, email, role) {
    localStorage.setItem(KEYS.ACCESS,  accessToken);
    localStorage.setItem(KEYS.REFRESH, refreshToken);
    localStorage.setItem(KEYS.EMAIL,   email);
    localStorage.setItem(KEYS.ROLE,    role);
  },
  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
  getAccess()  { return localStorage.getItem(KEYS.ACCESS);  },
  getRefresh() { return localStorage.getItem(KEYS.REFRESH); },
  getRole()    { return localStorage.getItem(KEYS.ROLE);    },
  getEmail()   { return localStorage.getItem(KEYS.EMAIL);   },
  isLoggedIn() { return !!localStorage.getItem(KEYS.ACCESS); },
};

// ── HTTP helper ────────────────────────────────────────────────────────────────
async function post(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${tokenStorage.getAccess()}`;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

// ── Normal user: email + password login ────────────────────────────────────────
export async function userLogin(email, password) {
  const data = await post('/api/auth/login', { email, password });
  tokenStorage.save(data.accessToken, data.refreshToken, data.email, 'user');
  return data;
}

// ── Normal user: register (requires OTP) ──────────────────────────────────────
export async function userSendOtp(email) {
  return post('/api/auth/send-otp', { email });
}

export async function userRegister(name, email, password, otp) {
  const data = await post('/api/auth/register', { name, email, password, otp });
  tokenStorage.save(data.accessToken, data.refreshToken, data.email, 'user');
  return data;
}

export function initiateGoogleLogin() {
  window.location.href = `${BASE}/oauth2/authorize/google?redirect_uri=${encodeURIComponent(window.location.origin + '/login-success')}`;
}

export function initiateGithubLogin() {
  window.location.href = `${BASE}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(window.location.origin + '/login-success')}`;
}

export function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken  = params.get('token');
  const refreshToken = params.get('refreshToken');
  const email        = params.get('email');

  if (accessToken && refreshToken) {
    tokenStorage.save(accessToken, refreshToken, email || '', 'user');
    return true;
  }
  return false;
}

// ── Admin / IAM: step 1 — email + password → preAuthToken ─────────────────────
export async function adminLogin(email, password) {
  // Returns { preAuthToken, message }
  return post('/api/admin/auth/login', { email, password });
}

// ── Admin / IAM: step 2 — verify OTP → full JWT ───────────────────────────────
export async function adminVerifyOtp(preAuthToken, otp, role = 'admin') {
  const data = await post('/api/admin/auth/verify-otp', { preAuthToken, otp });
  // backend returns AuthResponse { accessToken, refreshToken, email }
  tokenStorage.save(data.accessToken, data.refreshToken, data.email, role);
  return data;
}

// ── Refresh token ──────────────────────────────────────────────────────────────
export async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');
  const data = await post('/api/auth/refresh', { refreshToken });
  localStorage.setItem(KEYS.ACCESS, data.accessToken);
  if (data.refreshToken) localStorage.setItem(KEYS.REFRESH, data.refreshToken);
  return data;
}

// ── Logout ─────────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await post('/api/auth/logout', {}, true);
  } catch (_) { /* ignore */ }
  tokenStorage.clear();
}
