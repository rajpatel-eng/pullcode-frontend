import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../../context/UserContext'; // ← CHANGED
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import Modal from '../../../components/common/Modal';
import { useSnackbar } from '../../../components/common/Snackbar';
import {
  listAiModels, createAiModel, updateAiModel,
  rotateAiModelApiKey, pauseAiModel, resumeAiModel,
  setDefaultAiModel, deleteAiModel,
} from '../../../services/aiModelService';



// ── Shared style tokens (mirrors IamManagementPage exactly) ──────────────────
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

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
  fontFamily: 'inherit',
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
  ...btnSmall, border: 'none',
  background: 'var(--color-accent)', color: '#fff',
};

const btnSmallDanger = {
  ...btnSmall,
  border: '1px solid rgba(248,113,113,0.35)',
  background: 'rgba(248,113,113,0.1)', color: '#f87171',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ModelIcon({ provider, size = 40 }) {
  const letter = (provider || '?')[0].toUpperCase();
  const colors = {
    openai: '#10a37f', anthropic: '#d97706', google: '#4285f4',
    mistral: '#7c3aed', cohere: '#e11d48', meta: '#1877f2',
  };
  const key = (provider || '').toLowerCase();
  const bg = Object.entries(colors).find(([k]) => key.includes(k))?.[1] || 'var(--color-accent)';
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: bg + '22', border: `1.5px solid ${bg}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: bg, flexShrink: 0,
      letterSpacing: '-0.02em',
    }}>
      {letter}
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

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} width={400}>
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

// ── Add AI Model Modal ────────────────────────────────────────────────────────
function AddModelModal({ open, onClose, onCreated }) {
  const { showSnackbar } = useSnackbar();
  const empty = { name: '', provider: '', apiKey: '', apiBaseUrl: '', description: '', systemPrompt: '', temperature: '', maxTokens: '', defaultModel: false };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) { setForm(empty); setError(null); } }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.provider.trim() || !form.apiKey.trim() || !form.apiBaseUrl.trim()) {
      setError('Name, provider, API key and API base URL are required.');
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        provider: form.provider.trim(),
        apiKey: form.apiKey.trim(),
        apiBaseUrl: form.apiBaseUrl.trim(),
        description: form.description.trim() || null,
        systemPrompt: form.systemPrompt.trim() || null,
        temperature: form.temperature !== '' ? parseFloat(form.temperature) : null,
        maxTokens: form.maxTokens !== '' ? parseInt(form.maxTokens, 10) : null,
        defaultModel: form.defaultModel,
      };
      const created = await createAiModel(payload);
      showSnackbar('AI model created successfully.', 'success');
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add AI Model" width={480}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={fieldLabelStyle}>Model Name *</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. GPT-4o" style={inputStyle} autoFocus />
        </div>
        <div>
          <label style={fieldLabelStyle}>Provider *</label>
          <input type="text" value={form.provider} onChange={set('provider')} placeholder="e.g. OpenAI" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>API Key *</label>
        <input type="password" value={form.apiKey} onChange={set('apiKey')} placeholder="sk-…" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>API Base URL *</label>
        <input type="text" value={form.apiBaseUrl} onChange={set('apiBaseUrl')} placeholder="https://api.openai.com" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>Description</label>
        <input type="text" value={form.description} onChange={set('description')} placeholder="Optional short description" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>System Prompt</label>
        <textarea value={form.systemPrompt} onChange={set('systemPrompt')} placeholder="Optional system prompt…" style={textareaStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={fieldLabelStyle}>Temperature</label>
          <input type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={set('temperature')} placeholder="e.g. 0.7" style={inputStyle} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Max Tokens</label>
          <input type="number" min="1" value={form.maxTokens} onChange={set('maxTokens')} placeholder="e.g. 4096" style={inputStyle} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13, color: 'var(--color-textSecondary)' }}>
        <input type="checkbox" checked={form.defaultModel} onChange={set('defaultModel')} style={{ width: 15, height: 15, accentColor: 'var(--color-accent)' }} />
        Set as default model
      </label>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12.5 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onClose} style={btnSecondary} disabled={saving}>Cancel</button>
        <button onClick={handleSubmit} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Creating…' : 'Create Model'}
        </button>
      </div>
    </Modal>
  );
}

// ── Rotate API Key Modal ──────────────────────────────────────────────────────
function RotateKeyModal({ open, onClose, model, onRotated }) {
  const { showSnackbar } = useSnackbar();
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) { setNewKey(''); setError(null); } }, [open]);

  const handleSubmit = async () => {
    if (!newKey.trim()) { setError('New API key is required.'); return; }
    setSaving(true); setError(null);
    try {
      await rotateAiModelApiKey(model.id, newKey.trim());
      showSnackbar('API key rotated successfully.', 'success');
      onRotated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Rotate API Key" width={420}>
      <p style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginBottom: 14 }}>
        Enter a new API key for <strong style={{ color: 'var(--color-textPrimary)' }}>{model?.name}</strong>. The old key will be replaced immediately.
      </p>
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>New API Key</label>
        <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="sk-…" style={inputStyle} autoFocus />
      </div>
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12.5 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onClose} style={btnSecondary} disabled={saving}>Cancel</button>
        <button onClick={handleSubmit} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Rotating…' : 'Rotate Key'}
        </button>
      </div>
    </Modal>
  );
}

// ── AI Model Card ─────────────────────────────────────────────────────────────
function ModelCard({ model, onChanged, onRemoved, onSetDefault, isAdminRole = true }) {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

  const isActive = model.active === true;
  const isDefault = model.defaultModel === true;

  const statusStyle = isActive
    ? { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: 'Active' }
    : { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Paused' };

  useEffect(() => {
    setForm({
      name: model.name || '',
      provider: model.provider || '',
      apiBaseUrl: model.apiBaseUrl || '',
      description: model.description || '',
      systemPrompt: model.systemPrompt || '',
      temperature: model.temperature != null ? String(model.temperature) : '',
      maxTokens: model.maxTokens != null ? String(model.maxTokens) : '',
    });
  }, [model]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePauseResume = async () => {
    setBusyAction('toggle');
    try {
      const updated = isActive ? await pauseAiModel(model.id) : await resumeAiModel(model.id);
      onChanged({ ...model, ...updated });
      showSnackbar(isActive ? 'Model paused.' : 'Model resumed.', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Action failed.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSetDefault = async () => {
    setBusyAction('default');
    try {
      const updated = await setDefaultAiModel(model.id);
      // Single atomic update: clear all defaults and set this one — avoids React batching issues
      if (onSetDefault) onSetDefault(model.id, { ...model, ...updated, defaultModel: true });
      showSnackbar('Default model updated.', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Failed to set default.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteAiModel(model.id);
      const msg = res?.affected > 0
        ? `Model deleted. ${res.affected} repo(s) migrated to default.`
        : 'Model deleted.';
      showSnackbar(msg, 'success');
      setConfirmDelete(false);
      onRemoved(model.id);
    } catch (err) {
      showSnackbar(err.message || 'Failed to delete.', 'error');
    }
  };

  const handleEditClick = () => {
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.provider.trim() || !form.apiBaseUrl.trim()) {
      showSnackbar('Name, provider and API base URL are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        provider: form.provider.trim(),
        apiBaseUrl: form.apiBaseUrl.trim(),
        description: form.description.trim() || null,
        systemPrompt: form.systemPrompt.trim() || null,
        temperature: form.temperature !== '' ? parseFloat(form.temperature) : null,
        maxTokens: form.maxTokens !== '' ? parseInt(form.maxTokens, 10) : null,
      };
      const updated = await updateAiModel(model.id, payload);
      onChanged({ ...model, ...updated });
      showSnackbar('Model updated successfully.', 'success');
      setEditing(false);
      setExpanded(false);
    } catch (err) {
      showSnackbar(err.message || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      name: model.name || '', provider: model.provider || '',
      apiBaseUrl: model.apiBaseUrl || '', description: model.description || '',
      systemPrompt: model.systemPrompt || '',
      temperature: model.temperature != null ? String(model.temperature) : '',
      maxTokens: model.maxTokens != null ? String(model.maxTokens) : '',
    });
    setEditing(false);
  };

  return (
    <div style={{
      background: 'var(--color-bgSurface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ModelIcon provider={model.provider} />

        {/* name + provider */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {model.name}
            </span>
            {isDefault && (
              <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', flexShrink: 0 }}>
                DEFAULT
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {model.provider}{model.description ? ` · ${model.description}` : ''}
          </div>
        </div>

        {/* status badge */}
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, flexShrink: 0 }}>
          {statusStyle.label}
        </span>

        {/* action buttons */}
        {isAdminRole && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <>
              {/* Analytics */}
              <button
                onClick={() => navigate(`/admin/ai-models/${model.id}/analytics`)}
                style={{ ...btnSmall, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)' }}
              >
                📊 Analytics
              </button>
              {/* Pause / Resume */}
                <button
                  onClick={handlePauseResume}
                  disabled={busyAction !== null || isDefault}
                  title={isDefault ? 'Cannot pause the default model' : undefined}
                  style={{
                    ...btnSmall,
                    color: isActive ? '#fbbf24' : '#4ade80',
                    borderColor: isActive ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)',
                    background: isActive ? 'rgba(251,191,36,0.08)' : 'rgba(74,222,128,0.08)',
                    opacity: (busyAction || isDefault) ? 0.5 : 1,
                    cursor: isDefault ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busyAction === 'toggle' ? '…' : (isActive ? 'Pause' : 'Resume')}
                </button>

                {/* Set Default — only show when not already default and active */}
                {!isDefault && isActive && (
                  <button
                    onClick={handleSetDefault}
                    disabled={busyAction !== null}
                    style={{ ...btnSmall, color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)', opacity: busyAction ? 0.5 : 1 }}
                  >
                    {busyAction === 'default' ? '…' : 'Set Default'}
                  </button>
                )}

                {/* Edit / Save / Cancel */}
                {!editing ? (
                  <button onClick={handleEditClick} style={btnSmallPrimary}>Edit</button>
                ) : (
                  <>
                    <button onClick={handleCancelEdit} style={btnSmall} disabled={saving}>Cancel</button>
                    <button onClick={handleSave} style={{ ...btnSmallPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                )}
              </>
          </div>
        )}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={fieldLabelStyle}>Model Name</label>
              {editing
                ? <input type="text" value={form.name} onChange={set('name')} style={inputStyle} autoFocus />
                : <div style={inputStaticStyle}>{model.name}</div>}
            </div>
            <div>
              <label style={fieldLabelStyle}>Provider</label>
              {editing
                ? <input type="text" value={form.provider} onChange={set('provider')} style={inputStyle} />
                : <div style={inputStaticStyle}>{model.provider}</div>}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>API Base URL</label>
            {editing
              ? <input type="text" value={form.apiBaseUrl} onChange={set('apiBaseUrl')} style={inputStyle} />
              : <div style={inputStaticStyle}>{model.apiBaseUrl}</div>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>
              API Key{' '}
              <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--color-textMuted)' }}>
                (masked — use Rotate Key to change)
              </span>
            </label>
            <div style={{ ...inputStaticStyle, fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.1em', color: 'var(--color-textMuted)' }}>
              {model.apiKeyMask || '••••••••'}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>Description</label>
            {editing
              ? <input type="text" value={form.description} onChange={set('description')} placeholder="Optional" style={inputStyle} />
              : <div style={inputStaticStyle}>{model.description || '—'}</div>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>System Prompt</label>
            {editing
              ? <textarea value={form.systemPrompt} onChange={set('systemPrompt')} placeholder="Optional" style={textareaStyle} />
              : <div style={{ ...inputStaticStyle, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{model.systemPrompt || '—'}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={fieldLabelStyle}>Temperature</label>
              {editing
                ? <input type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={set('temperature')} placeholder="e.g. 0.7" style={inputStyle} />
                : <div style={inputStaticStyle}>{model.temperature != null ? model.temperature : '—'}</div>}
            </div>
            <div>
              <label style={fieldLabelStyle}>Max Tokens</label>
              {editing
                ? <input type="number" min="1" value={form.maxTokens} onChange={set('maxTokens')} placeholder="e.g. 4096" style={inputStyle} />
                : <div style={inputStaticStyle}>{model.maxTokens != null ? model.maxTokens : '—'}</div>}
            </div>
          </div>

          {!editing && model.createdByEmail && (
            <div style={{ marginBottom: 12 }}>
              <label style={fieldLabelStyle}>Created By</label>
              <div style={inputStaticStyle}>{model.createdByEmail}</div>
            </div>
          )}

          {!editing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              {isAdminRole && (
                <>
                  <button
                    onClick={() => setRotateOpen(true)}
                    style={{ ...btnSmall, color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.08)' }}
                  >
                    🔑 Rotate API Key
                  </button>
                  {!isDefault && (
                    <button onClick={() => setConfirmDelete(true)} style={btnDanger}>
                      Delete Model
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rotate Key Modal */}
      <RotateKeyModal
        open={rotateOpen}
        onClose={() => setRotateOpen(false)}
        model={model}
        onRotated={() => onChanged({ ...model })}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete AI Model"
        message={`Are you sure you want to delete "${model.name}"? Any repositories using it will be migrated to the default model.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAiModelsPage() {
  const { user } = useUser(); // ← CHANGED
  const { showSnackbar } = useSnackbar();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await listAiModels(0, 100);
      setModels(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load AI models.');
      showSnackbar(err.message || 'Failed to load AI models.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (created) => setModels((prev) => [created, ...prev]);

  const handleChanged = (updated) =>
    setModels((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));

  // When a model is set as default, clear defaultModel from all other models
  const handleSetDefault = (newDefaultId, updatedModel) =>
    setModels((prev) => prev.map((m) => {
      if (m.id === newDefaultId) return { ...m, ...(updatedModel || {}), defaultModel: true };
      return { ...m, defaultModel: false };
    }));

  const handleRemoved = (id) => setModels((prev) => prev.filter((m) => m.id !== id));

  // Sort: default first, then active, then paused, then deleted
  const sorted = [...models].sort((a, b) => {
    const rank = (m) => m.defaultModel ? 0 : m.active ? 1 : 2;
    return rank(a) - rank(b) || (a.name || '').localeCompare(b.name || '');
  });

  return (
    // user injected below via useUser()
    <DashboardLayout role="admin" user={user}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
            AI Models
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 0 }}>
            Configure and manage AI model integrations, API keys, and defaults.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{ ...btnPrimary, padding: '10px 18px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Model
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {loading && <Spinner size={32} />}

        {!loading && error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-textMuted)', fontSize: 13.5 }}>
            No AI models yet. Click "Add Model" to configure one.
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sorted.map((m) => (
              <ModelCard key={m.id} model={m} onChanged={handleChanged} onRemoved={handleRemoved} onSetDefault={handleSetDefault} isAdminRole={true} />
            ))}
          </div>
        )}
      </div>

      <AddModelModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
    </DashboardLayout>
  );
}