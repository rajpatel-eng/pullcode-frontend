import api from './api';
const data = (res) => res.data ?? null;

export const getSystemSummary        = ()                          => api.get('/api/analytics/summary').then(data);
export const getAllHealthStatuses     = ()                          => api.get('/api/analytics/health').then(data);
export const getAllAlerts             = ()                          => api.get('/api/analytics/alerts').then(data);
export const getAllRecommendations    = ()                          => api.get('/api/analytics/recommendations').then(data);

export const getModelDashboard       = (id)                        => api.get(`/api/analytics/models/${id}/dashboard`).then(data);
export const getUsageMetrics         = (id)                        => api.get(`/api/analytics/models/${id}/usage`).then(data);
export const getPerformanceMetrics   = (id)                        => api.get(`/api/analytics/models/${id}/performance`).then(data);
export const getQualityMetrics       = (id)                        => api.get(`/api/analytics/models/${id}/quality`).then(data);
export const getCostMetrics          = (id)                        => api.get(`/api/analytics/models/${id}/cost`).then(data);
export const getAdoptionMetrics      = (id)                        => api.get(`/api/analytics/models/${id}/adoption`).then(data);
export const getModelAlerts          = (id)                        => api.get(`/api/analytics/models/${id}/alerts`).then(data);
export const getModelRecommendations = (id)                        => api.get(`/api/analytics/models/${id}/recommendations`).then(data);
export const getModelHealth          = (id)                        => api.get(`/api/analytics/models/${id}/health`).then(data);

export const getUsageTrend           = (id, period = 'DAYS_30')   => api.get(`/api/analytics/models/${id}/trends/usage?period=${period}`).then(data);
export const getCostTrend            = (id, period = 'DAYS_30')   => api.get(`/api/analytics/models/${id}/trends/cost?period=${period}`).then(data);
export const getPerformanceTrend     = (id, period = 'DAYS_30')   => api.get(`/api/analytics/models/${id}/trends/performance?period=${period}`).then(data);
export const getErrorTrend           = (id, period = 'DAYS_30')   => api.get(`/api/analytics/models/${id}/trends/errors?period=${period}`).then(data);

export const compareModels           = (modelIds, period='DAYS_30') => api.post(`/api/analytics/compare?period=${period}`, { modelIds }).then(data);
export const resolveAlert            = (alertId)                   => api.post(`/api/analytics/alerts/${alertId}/resolve`).then(data);
export const getAiModels             = ()                          => api.get('/api/models').then(data);
