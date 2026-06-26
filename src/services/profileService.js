/**
 * src/services/profileService.js
 * All profile endpoints — uses the shared Axios instance (api.js).
 * Token refresh + 401 handling is done automatically by the interceptor.
 */

import api from './api';

// ── Response helpers ──────────────────────────────────────────────────────────
const data = (res) => res.data ?? null;

// ── Admin profile ─────────────────────────────────────────────────────────────
export const adminGetProfile      = () => api.get('/api/admin/profile').then(data);
export const adminUpdateName      = (name) =>
  api.patch('/api/admin/profile/name', { name }).then(data);
export const adminChangePassword  = (currentPassword, newPassword) =>
  api.patch('/api/admin/profile/password', { oldPassword: currentPassword, newPassword }).then(data);
export const adminUpdatePhoto     = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.patch('/api/admin/profile/photo', fd).then(data);
};

// ── IAM profile ───────────────────────────────────────────────────────────────
export const iamGetProfile        = () => api.get('/api/iam/profile').then(data);
export const iamChangePassword    = (currentPassword, newPassword) =>
  api.patch('/api/iam/profile/password', { oldPassword: currentPassword, newPassword }).then(data);
export const iamUpdatePhoto       = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.patch('/api/iam/profile/photo', fd).then(data);
};

// ── Regular user profile ───────────────────────────────────────────────────────
export const userGetProfile       = () => api.get('/api/user/profile').then(data);
export const userUpdateName       = (name) =>
  api.patch('/api/user/profile/name', { name }).then(data);
export const userChangePassword   = (oldPassword, newPassword) =>
  api.patch('/api/user/profile/password', { oldPassword, newPassword }).then(data);
export const userUpdatePhoto      = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.patch('/api/user/profile/photo', fd).then(data);
};
