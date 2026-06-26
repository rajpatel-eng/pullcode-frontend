import api from './api';
const data = (res) => res.data ?? null;

export const getAuditLogs = (params = {}) => {
  const q = new URLSearchParams();
  if (params.action)     q.set('action',     params.action);
  if (params.actorId)    q.set('actorId',    params.actorId);
  if (params.entityType) q.set('entityType', params.entityType);
  if (params.entityId)   q.set('entityId',   params.entityId);
  if (params.from)       q.set('from',       params.from);
  if (params.to)         q.set('to',         params.to);
  q.set('page', params.page ?? 0);
  q.set('size', params.size ?? 30);
  q.set('sort', params.sort || 'createdAt,desc');
  return api.get(`/api/admin/audit-logs?${q.toString()}`).then(data);
};

export const getIamAuditActivity = (iamId, page = 0, size = 10) =>
  api.get(`/api/admin/audit-logs/iam/${iamId}?page=${page}&size=${size}`).then(data);
