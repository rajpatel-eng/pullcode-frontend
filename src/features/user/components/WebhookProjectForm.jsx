import { useState, useEffect } from 'react';
import { addRepository } from '../../../services/repositoryService';
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

const PROVIDERS = [
  {
    id: 'github',
    label: 'GitHub',
    color: '#e8eaf0',
    placeholder: 'https://github.com/owner/repo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    color: '#fc6d26',
    placeholder: 'https://gitlab.com/owner/repo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z" />
      </svg>
    ),
  },
  {
    id: 'bitbucket',
    label: 'Bitbucket',
    color: '#0052cc',
    placeholder: 'https://bitbucket.org/owner/repo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.52.865 1.017.865h15.006c.368 0 .692-.25.771-.61L23.233 2.1a.768.768 0 0 0-.768-.892L.778 1.213zm14.52 13.316h-6.63l-1.74-9.21h10.09l-1.72 9.21z" />
      </svg>
    ),
  },
];

function detectProvider(url) {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com')) return 'gitlab';
  if (url.includes('bitbucket.org')) return 'bitbucket';
  return null;
}

export default function WebhookProjectForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    repoUrl: '',
    accessToken: '',
    branch: '',
    aiModelId: '',
  });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [aiModels, setAiModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null); // webhook info after creation

  useEffect(() => {
    listAiModels(0, 100)
      .then((res) => setAiModels(res?.content || []))
      .catch(() => setAiModels([]));
  }, []);

  function set(k) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => ({ ...f, [k]: val }));
      if (k === 'repoUrl') {
        setSelectedProvider(detectProvider(val));
      }
    };
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setError('Project title is required.');
    if (!form.repoUrl.trim()) return setError('Repository URL is required.');

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        repoUrl: form.repoUrl.trim(),
        accessToken: form.accessToken.trim() || undefined,
        branch: form.branch.trim() || undefined,
        aiModelId: form.aiModelId ? Number(form.aiModelId) : undefined,
      };
      const result = await addRepository(payload);
      setCreated(result);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  // ── Success / Webhook info screen ──────────────────────────────────────────
  if (created) {
    const providerSetupSteps = {
      GITHUB: [
        'Go to your repository → Settings → Webhooks → Add webhook',
        'Paste the Webhook URL below into "Payload URL"',
        'Set Content type to application/json',
        'Paste the Webhook Secret into "Secret"',
        'Choose "Just the push event" and save',
      ],
      GITLAB: [
        'Go to your project → Settings → Webhooks',
        'Paste the Webhook URL below into "URL"',
        'Paste the Webhook Secret into "Secret token"',
        'Enable "Push events" and save',
      ],
      BITBUCKET: [
        'Go to your repository → Repository settings → Webhooks → Add webhook',
        'Paste the Webhook URL below into "URL"',
        'Add a custom header X-Bitbucket-Token with your Webhook Secret',
        'Enable "Repository push" trigger and save',
      ],
    };

    const steps = providerSetupSteps[created.provider] || [];

    return (
      <div style={{
        background: 'var(--color-bgSurface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Success banner */}
        <div style={{
          background: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
            Project created — configure your webhook to start receiving reviews
          </span>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Webhook URL */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Webhook URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                readOnly
                value={created.webhookUrl || `${window.location.origin}/api/webhook/${(created.provider || '').toLowerCase()}`}
                style={{ ...inputStyle, background: 'var(--color-bgMuted)', fontFamily: 'monospace', fontSize: 12.5 }}
              />
              <CopyButton text={created.webhookUrl || ''} />
            </div>
          </div>

          {/* Webhook Secret */}
          {created.webhookSecret && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Webhook Secret</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={created.webhookSecret}
                  style={{ ...inputStyle, background: 'var(--color-bgMuted)', fontFamily: 'monospace', fontSize: 12.5 }}
                />
                <CopyButton text={created.webhookSecret} />
              </div>
              <div style={{ marginTop: 5, fontSize: 11.5, color: 'var(--color-textMuted)' }}>
                Save this secret — it won't be shown again.
              </div>
            </div>
          )}

          {/* Setup steps */}
          {steps.length > 0 && (
            <div style={{
              background: 'var(--color-bgMuted)', borderRadius: 8, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Setup steps for {created.provider}
              </div>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < steps.length - 1 ? 8 : 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: 'var(--color-accentSubtle)',
                    color: 'var(--color-accent)', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--color-textSecondary)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onCreated(created)}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: 'var(--color-accent)', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
          >
            Go to Project
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const activeProvider = PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <div>
      {/* Provider selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Git Provider</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProvider(p.id);
                // Auto-fill placeholder prefix if URL is empty
                if (!form.repoUrl) {
                  setForm((f) => ({ ...f, repoUrl: p.placeholder.split('/').slice(0, 3).join('/') + '/' }));
                }
              }}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                border: selectedProvider === p.id
                  ? `1.5px solid ${p.color}50`
                  : '1px solid var(--color-border)',
                background: selectedProvider === p.id
                  ? `${p.color}10`
                  : 'var(--color-bgMuted)',
                color: selectedProvider === p.id ? p.color : 'var(--color-textMuted)',
                transition: 'all 0.15s',
              }}
            >
              {p.icon}
              <span style={{ fontSize: 11.5, fontWeight: 600 }}>{p.label}</span>
            </button>
          ))}
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

      {/* Repo URL */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Repository URL</label>
        <input
          style={{
            ...inputStyle,
            borderColor: selectedProvider && !activeProvider ? 'rgba(248,113,113,0.5)' : undefined,
          }}
          placeholder={activeProvider?.placeholder || 'https://github.com/owner/repo'}
          value={form.repoUrl}
          onChange={set('repoUrl')}
        />
        {form.repoUrl && !detectProvider(form.repoUrl) && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#f87171' }}>
            Must be a valid GitHub, GitLab, or Bitbucket URL.
          </div>
        )}
      </div>

      {/* Branch */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Branch <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, defaults to main)</span></label>
        <input
          style={inputStyle}
          placeholder="main"
          value={form.branch}
          onChange={set('branch')}
        />
      </div>

      {/* Access Token */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Access Token <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, for private repos)</span></label>
        <input
          style={inputStyle}
          type="password"
          placeholder="ghp_••••••••••••••••"
          value={form.accessToken}
          onChange={set('accessToken')}
          autoComplete="off"
        />
        <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--color-textMuted)' }}>
          Needed only for private repositories. Stored encrypted.
        </div>
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
            background: saving ? 'var(--color-bgMuted)' : 'var(--color-accent)',
            color: saving ? 'var(--color-textMuted)' : '#fff',
            fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Creating…' : 'Create & Generate Webhook'}
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        flexShrink: 0, padding: '0 12px', borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: copied ? 'rgba(34,197,94,0.1)' : 'var(--color-bgMuted)',
        color: copied ? '#22c55e' : 'var(--color-textMuted)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
