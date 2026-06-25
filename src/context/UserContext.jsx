/**
 * UserContext — fetches the current user's profile once on mount and makes
 * { name, email, photoUrl } available to every page via useUser().
 *
 * Wrap both admin and IAM route trees with the matching provider in AppRoutes.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../services/authService';
import { adminGetProfile, iamGetProfile } from '../services/profileService';

const UserContext = createContext(null);

function extractPhotoUrl(data) {
  return data?.avatarUrl || data?.profilePhotoUrl || data?.photoUrl || null;
}

function buildFallback() {
  const email = tokenStorage.getEmail() || '';
  const name  = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  return { name, email, photoUrl: null };
}

export function AdminUserProvider({ children }) {
  const [user, setUser] = useState(buildFallback);

  const refresh = useCallback(() =>
    adminGetProfile()
      .then((data) => setUser({ name: data.name, email: data.email, photoUrl: extractPhotoUrl(data) }))
      .catch(() => {}),
  []);

  useEffect(() => { refresh(); }, [refresh]);

  return <UserContext.Provider value={{ user, setUser, refresh }}>{children}</UserContext.Provider>;
}

export function IamUserProvider({ children }) {
  const [user, setUser] = useState(buildFallback);

  const refresh = useCallback(() =>
    iamGetProfile()
      .then((data) => setUser({ name: data.name, email: data.email, photoUrl: extractPhotoUrl(data) }))
      .catch(() => {}),
  []);

  useEffect(() => { refresh(); }, [refresh]);

  return <UserContext.Provider value={{ user, setUser, refresh }}>{children}</UserContext.Provider>;
}

// Use this in every page instead of getStoredUser()
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside AdminUserProvider or IamUserProvider');
  return ctx;
}