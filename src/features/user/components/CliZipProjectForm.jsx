import { useState, useEffect } from 'react';
import { createZipProject } from '../../../services/projectService';
import { listAiModels } from '../../../services/aiModelService';

const inputStyle = {
  width: '100%',
  background: 'var(--color-bgMuted)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13.5,
  color: 'var(--color-textPrimary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--color-textMuted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 5, display: 'block',
};

const fieldStyle = { marginBottom: 18 };

export default function CliZipProjectForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', aiModelId: '' });
  const [aiModels, setAiModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    listAiModels(0, 100)
      .then((res) => setAiModels(res?.content || []))
      .catch(() => setAiModels([]));
  }, []);

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setError('Project title is required.');
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        aiModelId: form.aiModelId ? Number(form.aiModelId) : undefined,
      };
      const result = await createZipProject(payload);
      setCreated(result);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div style={{
        background: 'var(--color-bgSurface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Success banner */}
        <div style={{
          background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.2)',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#8b5cf6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#8b5cf6' }}>
            Project "{created.title}" created — generate a CLI token to start pushing
          </span>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Project ID */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--color-bgMuted)',
            borderRadius: 8, marginBottom: 20,
          }}>
            <span style={{ fontSize: 12.5, color: 'var(--color-textMuted)' }}>Project ID</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-textPrimary)', fontFamily: 'monospace' }}>
              {created.id}
            </span>
          </div>

          {/* Next steps */}
          <div style={{
            background: 'var(--color-bgMuted)', borderRadius: 8, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Next steps
            </div>
            {[
              'Open the project and go to the CLI Tokens tab',
              'Generate a token and give it a name (e.g. "laptop-dev")',
              'Install our CLI: npm install -g @codereview/cli',
              'Run: codereview push --token <your-token> --project ' + created.id,
              'Or upload a ZIP file directly from the project page',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 8 : 0 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'rgba(139,92,246,0.15)',
                  color: '#8b5cf6', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-textSecondary)', lineHeight: 1.5, fontFamily: i === 3 ? 'monospace' : 'inherit', fontSize: i === 3 ? 12 : 13 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onCreated(created)}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#8b5cf6', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
          >
            Open Project
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* How it works info box */}
      <div style={{
        background: 'rgba(139,92,246,0.07)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)', lineHeight: 1.55 }}>
          After creating the project, you'll generate a <strong style={{ color: 'var(--color-textPrimary)' }}>CLI token</strong> to push code from the terminal, or upload a <strong style={{ color: 'var(--color-textPrimary)' }}>ZIP file</strong> directly from the project page.
        </div>
      </div>

      {/* Title */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Project Title</label>
        <input
          style={inputStyle}
          placeholder="e.g. My Backend API"
          value={form.title}
          onChange={set('title')}
        />
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 72,
            lineHeight: 1.5,
          }}
          placeholder="Brief description of this project…"
          value={form.description}
          onChange={set('description')}
        />
      </div>

      {/* AI Model */}
      {aiModels.length > 0 && (
        <div style={fieldStyle}>
          <label style={labelStyle}>AI Model <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.aiModelId}
            onChange={set('aiModelId')}
          >
            <option value="">Default model</option>
            {aiModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          fontSize: 13, color: '#f87171',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-bgMuted)', color: 'var(--color-textSecondary)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: saving ? 'var(--color-bgMuted)' : '#8b5cf6',
            color: saving ? 'var(--color-textMuted)' : '#fff',
            fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </div>
  );
}
