import api from './api';
const data = (res) => res.data ?? null;

export const listAiModels       = (page = 0, size = 100) => api.get(`/api/models?page=${page}&size=${size}`).then(data);
export const getAiModel         = (id)                   => api.get(`/api/models/${id}`).then(data);
export const createAiModel      = (body)                 => api.post('/api/models', body).then(data);
export const updateAiModel      = (id, body)             => api.put(`/api/models/${id}`, body).then(data);
export const rotateAiModelApiKey= (id, newApiKey)        => api.patch(`/api/models/${id}/api-key`, { newApiKey }).then(data);
export const pauseAiModel       = (id)                   => api.post(`/api/models/${id}/pause`).then(data);
export const resumeAiModel      = (id)                   => api.post(`/api/models/${id}/resume`).then(data);
export const setDefaultAiModel  = (id)                   => api.post(`/api/models/${id}/set-default`).then(data);
export const deleteAiModel      = (id)                   => api.delete(`/api/models/${id}`).then(data);
