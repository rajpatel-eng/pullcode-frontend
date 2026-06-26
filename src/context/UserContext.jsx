import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage, SESSION_EXPIRED_ERROR } from '../services/authService';
import { adminGetProfile, iamGetProfile, userGetProfile } from '../services/profileService';

const UserContext = createContext(null);

function extractPhotoUrl(data) {
  return data?.avatarUrl || data?.profilePhotoUrl || data?.photoUrl || null;
}

function buildFallback() {
  const email = tokenStorage.getEmail() || '';
  const name  = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  return { name, email, photoUrl: null };
}

// Returns true if we arrived here just after an OAuth redirect
// (the URL will contain ?token= or we came from /login-success via replace).
// In that case we give a grace period before treating 401 as "session expired".
function isJustAfterOAuth() {
  const ref = document.referrer;
  return (
    ref.includes('/login-success') ||
    ref.includes('/oauth2/') ||
    window.location.search.includes('token=')
  );
}

function makeProviderErrorHandler(redirectPath) {
  return function handleError(err) {
    if (err?.message !== SESSION_EXPIRED_ERROR) {
      // Non-auth error (network, 500, etc.) — stay on current page
      return;
    }
    // Genuine session expiry — but only redirect if we're NOT in a
    // post-OAuth grace window. Right after OAuth the localStorage tokens
    // may not yet be committed; the cookie auth handles it transparently.
    if (isJustAfterOAuth()) {
      console.warn('[UserContext] 401 during post-OAuth load — skipping redirect, cookie auth active');
      return;
    }
    // Confirmed expired session — send to login
    tokenStorage.clear();
    const isUser = window.location.pathname.startsWith('/user');
    window.location.replace(isUser ? '/user/login' : '/management/login');
  };
}

export function AdminUserProvider({ children }) {
  const [user, setUser] = useState(buildFallback);
  const refresh = useCallback(() =>
    adminGetProfile()
      .then((data) => setUser({ name: data.name, email: data.email, photoUrl: extractPhotoUrl(data) }))
      .catch(makeProviderErrorHandler('/management/login')),
  []);
  useEffect(() => { refresh(); }, [refresh]);
  return <UserContext.Provider value={{ user, setUser, refresh }}>{children}</UserContext.Provider>;
}

export function IamUserProvider({ children }) {
  const [user, setUser] = useState(buildFallback);
  const refresh = useCallback(() =>
    iamGetProfile()
      .then((data) => setUser({ name: data.name, email: data.email, photoUrl: extractPhotoUrl(data) }))
      .catch(makeProviderErrorHandler('/management/login')),
  []);
  useEffect(() => { refresh(); }, [refresh]);
  return <UserContext.Provider value={{ user, setUser, refresh }}>{children}</UserContext.Provider>;
}

export function UserUserProvider({ children }) {
  const [user, setUser] = useState(buildFallback);
  const refresh = useCallback(() =>
    userGetProfile()
      .then((data) => setUser({ name: data.name, email: data.email, photoUrl: extractPhotoUrl(data) }))
      .catch(makeProviderErrorHandler('/user/login')),
  []);
  useEffect(() => { refresh(); }, [refresh]);
  return <UserContext.Provider value={{ user, setUser, refresh }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside a UserProvider');
  return ctx;
}
