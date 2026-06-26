import api from './api';
const data = (res) => res.data ?? null;

export const listIamUsers    = (page = 0, size = 100) => api.get(`/api/admin/iam?page=${page}&size=${size}`).then(data);
export const getIamUser      = (id)                   => api.get(`/api/admin/iam/${id}`).then(data);
export const createIamUser   = (body)                 => api.post('/api/admin/iam', body).then(data);
export const updateIamName   = (id, name)             => api.patch(`/api/admin/iam/${id}/name`, { name }).then(data);
export const updateIamEmail  = (id, email)            => api.patch(`/api/admin/iam/${id}/email`, { email }).then(data);
export const resetIamPassword= (id, newPassword)      => api.patch(`/api/admin/iam/${id}/password`, { newPassword }).then(data);
export const pauseIamUser    = (id)                   => api.post(`/api/admin/iam/${id}/pause`).then(data);
export const resumeIamUser   = (id)                   => api.post(`/api/admin/iam/${id}/resume`).then(data);
export const deleteIamUser   = (id)                   => api.delete(`/api/admin/iam/${id}`).then(data);
