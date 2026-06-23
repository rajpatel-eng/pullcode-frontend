import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import Modal from '../../../components/common/Modal';
import { useSnackbar } from '../../../components/common/Snackbar';
import {
  listIamUsers, createIamUser, updateIamName, updateIamEmail,
  resetIamPassword, pauseIamUser, resumeIamUser, deleteIamUser,
} from '../../../services/iamService';

import { tokenStorage } from '../../../services/authService';
function getStoredUser() { const email = tokenStorage.getEmail() || ''; const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Admin'; return { name, email }; }

const STATUS_ORDER = { ACTIVE: 0, PAUSED: 1, DELETED: 2 };

const STATUS_STYLE = {
  ACTIVE: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: 'Active' },
  PAUSED: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Paused' },
  DELETED: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Deleted' },
};

function Avatar({ name, size = 40 }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--color-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Spinner({ size = 28 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
      <div style={{ width: size, height: size, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const fieldLabelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--color-textMuted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block',
};

const inputStyle = {
  width: '100%',
  background: 'var(--color-bgMuted)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 13.5,
  color: 'var(--color-textPrimary)',
  outline: 'none',
  boxSizing: 'border-box',
};

const inputStaticStyle = {
  ...inputStyle,
  background: 'var(--color-bgSurface)',
  border: '1px solid transparent',
  padding: '8px 0',
  color: 'var(--color-textPrimary)',
};

const btnPrimary = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: 'var(--color-accent)', color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnSecondary = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
  background: 'var(--color-bgMuted)', color: 'var(--color-textSecondary)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnDanger = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.35)',
  background: 'rgba(248,113,113,0.1)', color: '#f87171',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnSmall = {
  padding: '5px 12px', borderRadius: 7, border: '1px solid var(--color-border)',
  background: 'var(--color-bgMuted)', color: 'var(--color-textSecondary)',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
};

const btnSmallPrimary = {
  ...btnSmall,
  border: 'none',
  background: 'var(--color-accent)',
  color: '#fff',
};

const btnSmallDanger = {
  ...btnSmall,
  border: '1px solid rgba(248,113,113,0.35)',
  background: 'rgba(248,113,113,0.1)',
  color: '#f87171',
};

// ─── Add IAM modal ────────────────────────────────────────────────────────────
function AddIamModal({ open, onClose, onCreated }) {
  const { showSnackbar } = useSnackbar();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', password: '' });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createIamUser(form);
      showSnackbar('IAM user created successfully.', 'success');
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message || 'Failed to create IAM user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add IAM User" width={420}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Alice Chen"
            style={inputStyle}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="e.g. alice@corp.io"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={fieldLabelStyle}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Minimum 8 characters"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12.5,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} style={btnSecondary} disabled={saving}>Cancel</button>
          <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
            {saving ? 'Creating…' : 'Create IAM User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Confirm dialog (delete) ─────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} width={380}>
      <p style={{ fontSize: 13.5, color: 'var(--color-textSecondary)', marginBottom: 18 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onClose} style={btnSecondary} disabled={busy}>Cancel</button>
        <button onClick={handleConfirm} style={{ ...(danger ? btnDanger : btnPrimary), opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ─── IAM Card ─────────────────────────────────────────────────────────────────
function IamCard({ user, onChanged }) {
  const { showSnackbar } = useSnackbar();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '' });
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = STATUS_STYLE[user.status] || STATUS_STYLE.ACTIVE;
  const isDeleted = user.status === 'DELETED';
  const isPaused = user.status === 'PAUSED';

  useEffect(() => {
    setForm({ name: user.name, email: user.email, password: '' });
  }, [user.name, user.email]);

  const handlePauseResume = async () => {
    setBusyAction('toggle');
    try {
      const updated = isPaused ? await resumeIamUser(user.id) : await pauseIamUser(user.id);
      onChanged({ ...user, ...updated });
      showSnackbar(isPaused ? 'IAM user resumed.' : 'IAM user paused.', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Action failed.', 'error');
    } finally {
      setBusyAction(null);
    }
  };



  const handleRestore = async () => {
    setBusyAction('restore');
    try {
      // pauseIam doesn't block DELETED users — it sets status to PAUSED, effectively restoring
      const updated = await pauseIamUser(user.id);
      onChanged({ ...user, ...updated });
      showSnackbar('IAM user restored (set to Paused). You can resume them to make Active.', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Restore failed.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIamUser(user.id);
      onChanged({ ...user, status: 'DELETED' });
      showSnackbar('IAM user deleted.', 'success');
      setConfirmDelete(false);
      setExpanded(false);
    } catch (err) {
      showSnackbar(err.message || 'Failed to delete.', 'error');
    }
  };

  const handleEditClick = () => {
    setForm({ name: user.name, email: user.email, password: '' });
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showSnackbar('Name and email are required.', 'error');
      return;
    }
    if (form.password && form.password.length < 8) {
      showSnackbar('Password must be at least 8 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      let updated = user;
      if (form.name !== user.name) updated = await updateIamName(user.id, form.name);
      if (form.email !== user.email) updated = await updateIamEmail(user.id, form.email);
      if (form.password) await resetIamPassword(user.id, form.password);
      onChanged({ ...user, ...updated, name: form.name, email: form.email });
      showSnackbar('IAM user updated successfully.', 'success');
      setForm((f) => ({ ...f, password: '' }));
      setEditing(false);
      setExpanded(false);
    } catch (err) {
      showSnackbar(err.message || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: user.name, email: user.email, password: '' });
    setEditing(false);
  };

  return (
    <div style={{
      background: 'var(--color-bgSurface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '14px 16px',
      opacity: isDeleted ? 0.65 : 1,
      transition: 'opacity 0.15s',
    }}>
      {/* ── Header row: avatar + info + status badge + action buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={user.name} />

        {/* name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
        </div>

        {/* status badge */}
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 600,
          background: status.bg, color: status.color, flexShrink: 0,
        }}>
          {status.label}
        </span>

        {/* action buttons — right side, small */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isDeleted ? (
            <button
              onClick={handleRestore}
              disabled={busyAction !== null}
              style={{
                ...btnSmall,
                color: '#4ade80',
                borderColor: 'rgba(74,222,128,0.3)',
                background: 'rgba(74,222,128,0.08)',
                opacity: busyAction ? 0.6 : 1,
              }}
            >
              {busyAction === 'restore' ? '…' : '↩ Restore'}
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                disabled={busyAction !== null}
                style={{
                  ...btnSmall,
                  color: isPaused ? '#4ade80' : '#fbbf24',
                  borderColor: isPaused ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)',
                  background: isPaused ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)',
                  opacity: busyAction ? 0.6 : 1,
                }}
              >
                {busyAction === 'toggle' ? '…' : (isPaused ? 'Resume' : 'Pause')}
              </button>
              {!editing ? (
                <button onClick={handleEditClick} style={btnSmallPrimary}>
                  Edit
                </button>
              ) : (
                <>
                  <button onClick={handleCancelEdit} style={btnSmall} disabled={saving}>Cancel</button>
                  <button onClick={handleSave} style={{ ...btnSmallPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Expand toggle ── */}
      <button
        onClick={() => { if (!editing) setExpanded((e) => !e); }}
        style={{
          width: '100%', marginTop: 10, padding: '5px 0', background: 'transparent',
          border: 'none', cursor: editing ? 'default' : 'pointer',
          color: 'var(--color-textMuted)', fontSize: 11.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {expanded ? 'Hide details' : 'Show details'}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>Name</label>
            {editing ? (
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} autoFocus />
            ) : (
              <div style={inputStaticStyle}>{user.name}</div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>Email</label>
            {editing ? (
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
            ) : (
              <div style={inputStaticStyle}>{user.email}</div>
            )}
          </div>

          {editing && (
            <div style={{ marginBottom: 12 }}>
              <label style={fieldLabelStyle}>
                New Password{' '}
                <span style={{ textTransform: 'none', color: 'var(--color-textMuted)', fontWeight: 400 }}>(leave blank to keep unchanged)</span>
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 characters" style={inputStyle} />
            </div>
          )}

          {!editing && user.createdByEmail && (
            <div style={{ marginBottom: 4 }}>
              <label style={fieldLabelStyle}>Created By</label>
              <div style={inputStaticStyle}>{user.createdByEmail}</div>
            </div>
          )}

          {!editing && !isDeleted && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => setConfirmDelete(true)} style={btnDanger}>Delete IAM User</button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete IAM User"
        message={`Are you sure you want to delete "${user.name}"? This marks the account as deleted.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IamManagementPage() {
  const { showSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listIamUsers(0, 100);
      setUsers(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load IAM users.');
      showSnackbar(err.message || 'Failed to load IAM users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (created) => {
    setUsers((prev) => [created, ...prev]);
  };

  const handleChanged = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
  };

  const sorted = [...users].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <DashboardLayout role="admin" user={getStoredUser()}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
            IAM Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 0 }}>
            Manage IAM users, access, and credentials.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            ...btnPrimary, padding: '10px 18px', fontSize: 13.5,
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add IAM
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {loading && <Spinner size={32} />}

        {!loading && error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', borderRadius: 8, padding: '10px 16px', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-textMuted)', fontSize: 13.5 }}>
            No IAM users yet. Click "Add IAM" to create one.
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sorted.map((u) => (
              <IamCard key={u.id} user={u} onChanged={handleChanged} />
            ))}
          </div>
        )}
      </div>

      <AddIamModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
    </DashboardLayout>
  );
}