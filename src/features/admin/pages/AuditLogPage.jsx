import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { getAuditLogs } from '../../../services/auditLogService';

import { useUser } from '../../../context/UserContext'; // ← CHANGED

const ACTION_OPTIONS = [
  'IAM_CREATED', 'IAM_UPDATED', 'IAM_PAUSED', 'IAM_RESUMED', 'IAM_DELETED', 'IAM_PASSWORD_RESET',
  'AI_MODEL_CREATED', 'AI_MODEL_UPDATED', 'AI_MODEL_PAUSED', 'AI_MODEL_RESUMED', 'AI_MODEL_DELETED',
  'AI_MODEL_API_KEY_ROTATED', 'DEFAULT_MODEL_CHANGED', 'REPO_AI_MODEL_CHANGED',
];

const ACTION_COLOR = (action) => {
  if (!action) return '#6b7280';
  if (action.includes('DELETED')) return '#f87171';
  if (action.includes('CREATED')) return '#4ade80';
  if (action.includes('PAUSED')) return '#fbbf24';
  if (action.includes('RESUMED')) return '#60a5fa';
  if (action.includes('PASSWORD_RESET') || action.includes('API_KEY_ROTATED')) return '#f97316';
  return '#a78bfa';
};

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: color + '20', color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 26, height: 26, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function JsonPreview({ value, label }) {
  const [open, setOpen] = useState(false);
  if (!value) return <span style={{ color: 'var(--color-textMuted)' }}>—</span>;

  let pretty = value;
  try { pretty = JSON.stringify(JSON.parse(value), null, 2); } catch (_) { /* not json */ }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 11.5, fontWeight: 600, color: 'var(--color-accent)',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {open ? 'Hide' : 'View'} {label}
      </button>
      {open && (
        <pre style={{
          marginTop: 6, fontSize: 11.5, lineHeight: 1.5, color: 'var(--color-textSecondary)',
          background: 'var(--color-bgMuted)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '10px 12px', maxWidth: 360, maxHeight: 220,
          overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {pretty}
        </pre>
      )}
    </div>
  );
}

const inputStyle = {
  background: 'var(--color-bgMuted)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--color-textPrimary)',
  outline: 'none',
  minWidth: 160,
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--color-textMuted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block',
};

export default function AuditLogPage() {
  const { user } = useUser(); // ← CHANGED
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const scrollRef = useRef(null);
  const PAGE_SIZE = 30;

  const buildParams = useCallback((pageNum) => {
    const params = { page: pageNum, size: PAGE_SIZE, sort: 'createdAt,desc' };
    if (action) params.action = action;
    if (actorId) params.actorId = actorId;
    if (entityType) params.entityType = entityType;
    if (entityId) params.entityId = entityId;
    if (from) params.from = `${from}T00:00:00`;
    if (to) params.to = `${to}T23:59:59`;
    return params;
  }, [action, actorId, entityType, entityId, from, to]);

  const fetchPage = useCallback(async (pageNum, append) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs(buildParams(pageNum));
      setLogs((prev) => (append ? [...prev, ...(data.content || [])] : (data.content || [])));
      setTotalPages(data.totalPages ?? 1);
      setPage(pageNum);
    } catch (e) {
      setError(e.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Initial load + reload on filter change
  useEffect(() => {
    fetchPage(0, false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, actorId, entityType, entityId, from, to]);

  // Infinite scroll handler
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loading) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom && page + 1 < totalPages) {
      fetchPage(page + 1, true);
    }
  };

  const clearFilters = () => {
    setAction(''); setActorId(''); setEntityType(''); setEntityId(''); setFrom(''); setTo('');
  };

  const hasFilters = action || actorId || entityType || entityId || from || to;

  return (
    <DashboardLayout role="admin" user={user}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Fixed header section */}
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 24 }}>
            Track administrative actions, configuration changes, and security events.
          </p>

          {/* Filters */}
          <div
            style={{
              background: 'var(--color-bgSurface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: '16px 18px',
              marginBottom: 18,
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label style={labelStyle}>Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} style={{ ...inputStyle, minWidth: 200 }}>
                <option value="">All actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Actor ID</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                style={{ ...inputStyle, minWidth: 100 }}
              />
            </div>

            <div>
              <label style={labelStyle}>Entity Type</label>
              <input
                type="text"
                placeholder="e.g. IAM_USER"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                style={{ ...inputStyle, minWidth: 140 }}
              />
            </div>

            <div>
              <label style={labelStyle}>Entity ID</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                style={{ ...inputStyle, minWidth: 100 }}
              />
            </div>

            <div>
              <label style={labelStyle}>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-bgMuted)', color: 'var(--color-textSecondary)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', height: 34,
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Table - fills remaining height, only this scrolls */}
        <div
          style={{
            background: 'var(--color-bgSurface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 170px 200px 1fr 220px 130px 1fr',
              padding: '10px 20px',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-textMuted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span>ID</span>
            <span>Timestamp</span>
            <span>Action</span>
            <span>Actor</span>
            <span>Entity</span>
            <span>IP Address</span>
            <span>Changes</span>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            {logs.length === 0 && !loading && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-textMuted)', fontSize: 13 }}>
                No audit logs found.
              </div>
            )}

            {logs.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 170px 200px 1fr 220px 130px 1fr',
                  padding: '13px 20px',
                  borderBottom: i < logs.length - 1 ? '1px solid var(--color-border)' : 'none',
                  fontSize: 13,
                  color: 'var(--color-textPrimary)',
                  alignItems: 'start',
                  gap: 12,
                }}
              >
                <span style={{ color: 'var(--color-textMuted)' }}>#{log.id}</span>
                <span style={{ color: 'var(--color-textSecondary)', fontSize: 12.5 }}>{formatDate(log.createdAt)}</span>
                <span>
                  <Badge label={(log.action || '').replaceAll('_', ' ')} color={ACTION_COLOR(log.action)} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.actorEmail || '—'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)' }}>ID: {log.actorId}</div>
                </span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--color-textSecondary)' }}>{log.entityType}</div>
                  {log.entityId != null && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)' }}>ID: {log.entityId}</div>
                  )}
                </span>
                <span style={{ color: 'var(--color-textSecondary)', fontSize: 12.5, wordBreak: 'break-all' }}>
                  {log.ipAddress || '—'}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <JsonPreview value={log.oldValue} label="old" />
                  <JsonPreview value={log.newValue} label="new" />
                </span>
              </div>
            ))}

            {loading && <Spinner />}

            {!loading && page + 1 >= totalPages && logs.length > 0 && (
              <div style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--color-textMuted)', fontSize: 12 }}>
                End of audit log
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}