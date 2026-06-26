import api from './api';
const data = (res) => res.data ?? null;

export const getMyRepositories = ()                       => api.get('/api/repositories').then(data);
export const getRepository     = (id)                     => api.get(`/api/repositories/${id}`).then(data);
export const addRepository     = (body)                   => api.post('/api/repositories', body).then(data);
export const deleteRepository  = (id)                     => api.delete(`/api/repositories/${id}`).then(data);
export const updateAccessToken = (id, accessToken)        => api.patch(`/api/repositories/${id}/token`, { accessToken }).then(data);
export const updateAiModel     = (id, aiModelId)          => api.patch(`/api/repositories/${id}/ai-model`, { aiModelId }).then(data);
