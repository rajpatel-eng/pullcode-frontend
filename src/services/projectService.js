import api from './api';
const data = (res) => res.data ?? null;

// ── ZIP Projects ───────────────────────────────────────────────────────────────
export const createZipProject    = (body)       => api.post('/api/zip/projects', body).then(data);
export const getAllZipProjects    = ()           => api.get('/api/zip/projects').then(data);
export const getZipProject       = (id)         => api.get(`/api/zip/projects/${id}`).then(data);
export const updateZipProject    = (id, body)   => api.patch(`/api/zip/projects/${id}`, body).then(data);
export const deleteZipProject    = (id)         => api.delete(`/api/zip/projects/${id}`).then(data);
export const uploadZip           = (projectId, formData) =>
  api.post(`/api/zip/projects/${projectId}/upload`, formData).then(data);
export const getZipCommitHistory = (projectId, page = 0, size = 20) =>
  api.get(`/api/zip/projects/${projectId}/history?page=${page}&size=${size}`).then(data);

// ── CLI Tokens ─────────────────────────────────────────────────────────────────
export const generateCliToken = (projectId, body)         => api.post(`/api/cli/projects/${projectId}/tokens`, body).then(data);
export const getCliTokens     = (projectId)               => api.get(`/api/cli/projects/${projectId}/tokens`).then(data);
export const renameCliToken   = (projectId, tokenId, body)=> api.patch(`/api/cli/projects/${projectId}/tokens/${tokenId}/rename`, body).then(data);
export const toggleCliToken   = (projectId, tokenId)      => api.patch(`/api/cli/projects/${projectId}/tokens/${tokenId}/toggle`).then(data);
export const deleteCliToken   = (projectId, tokenId)      => api.delete(`/api/cli/projects/${projectId}/tokens/${tokenId}`).then(data);
