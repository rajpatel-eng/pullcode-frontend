import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import {
  getZipProject, deleteZipProject, getZipCommitHistory, uploadZip,
} from '../../../services/projectService';
import {
  getCliTokens, generateCliToken, renameCliToken, toggleCliToken, deleteCliToken,
} from '../../../services/projectService';

const inputStyle = {
  width: '100%', background: 'var(--color-bgMuted)', border: '1px solid var(--color-border)',
  borderRadius: 8, padding: '8px 11px', fontSize: 13.5, color: 'var(--color-textPrimary)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--color-textMuted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block',
};
const TAB_IDS = ['overview', 'tokens', 'upload', 'history'];

function Tab({ id, active, label, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
        background: active ? 'var(--color-navActiveBg)' : 'transparent',
        color: active ? 'var(--color-navActiveText)' : 'var(--color-textMuted)',
        fontSize: 13.5, fontWeight: active ? 600 : 400, transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function CopyButton({ text, small }) {
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
        flexShrink: 0, padding: small ? '4px 10px' : '0 12px', height: small ? undefined : '100%',
        borderRadius: 7, border: '1px solid var(--color-border)',
        background: copied ? 'rgba(34,197,94,0.1)' : 'var(--color-bgMuted)',
        color: copied ? '#22c55e' : 'var(--color-textMuted)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ project, onDelete }) {
  const rows = [
    ['Project ID', project.id],
    ['AI Model', project.aiModelName || '—'],
    ['Commits', project.commitCount ?? '—'],
    ['Latest Commit', project.latestCommitMessage || '—'],
    ['Created', project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'],
    ['Updated', project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'],
  ];
  return (
    <div>
      {project.description && (
        <p style={{ fontSize: 13.5, color: 'var(--color-textSecondary)', marginBottom: 20, lineHeight: 1.6 }}>
          {project.description}
        </p>
      )}
      <div style={{
        background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
        borderRadius: 10, overflow: 'hidden', marginBottom: 24,
      }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', padding: '12px 18px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-textPrimary)', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onDelete}
        style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)',
          background: 'rgba(248,113,113,0.08)', color: '#f87171',
          fontSize: 13, cursor: 'pointer', fontWeight: 500,
        }}
      >
        Delete Project
      </button>
    </div>
  );
}

// ── Tokens ────────────────────────────────────────────────────────────────────
function TokensTab({ projectId }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [error, setError] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    try { setTokens(await getCliTokens(projectId) || []); } catch { setTokens([]); } finally { setLoading(false); }
  }

  async function generate() {
    if (!newName.trim()) return setError('Enter a name for this token.');
    setGenerating(true); setError(null);
    try {
      const t = await generateCliToken(projectId, { name: newName.trim() });
      setNewToken(t);
      setNewName('');
      load();
    } catch (e) { setError(e.message); } finally { setGenerating(false); }
  }

  async function toggle(tokenId) {
    try { const updated = await toggleCliToken(projectId, tokenId); setTokens((ts) => ts.map((t) => t.id === tokenId ? updated : t)); } catch { }
  }

  async function remove(tokenId) {
    if (!confirm('Delete this token? This cannot be undone.')) return;
    try { await deleteCliToken(projectId, tokenId); setTokens((ts) => ts.filter((t) => t.id !== tokenId)); } catch { }
  }

  async function saveRename(tokenId) {
    try { const updated = await renameCliToken(projectId, tokenId, { name: renameVal }); setTokens((ts) => ts.map((t) => t.id === tokenId ? updated : t)); setRenamingId(null); } catch { }
  }

  return (
    <div>
      {/* Generate new token */}
      <div style={{
        background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
        borderRadius: 10, padding: '16px 18px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 12 }}>Generate New Token</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder='e.g. "laptop-dev" or "ci-pipeline"'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: generating ? 'var(--color-bgMuted)' : '#8b5cf6',
              color: generating ? 'var(--color-textMuted)' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', flexShrink: 0,
            }}
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, fontSize: 12.5, color: '#f87171' }}>{error}</div>}
      </div>

      {/* Newly generated token — show once */}
      {newToken?.token && (
        <div style={{
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 10, padding: '14px 16px', marginBottom: 18,
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8b5cf6', marginBottom: 8 }}>
            Token generated — copy it now, it won't be shown again
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              readOnly
              value={newToken.token}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, background: 'var(--color-bgMuted)' }}
            />
            <CopyButton text={newToken.token} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-textMuted)' }}>
            Use it with: <code style={{ background: 'var(--color-bgMuted)', padding: '1px 6px', borderRadius: 4, fontSize: 11.5 }}>codereview push --token {newToken.token} --project {projectId}</code>
          </div>
        </div>
      )}

      {/* Token list */}
      {loading ? (
        <div style={{ fontSize: 13.5, color: 'var(--color-textMuted)' }}>Loading tokens…</div>
      ) : tokens.length === 0 ? (
        <div style={{
          padding: '24px', textAlign: 'center',
          background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
          borderRadius: 10, fontSize: 13.5, color: 'var(--color-textMuted)',
        }}>
          No tokens yet. Generate one above to start pushing code from the CLI.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tokens.map((t) => (
            <div key={t.id} style={{
              background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '13px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === t.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        autoFocus
                        style={{ ...inputStyle, padding: '5px 9px', fontSize: 13 }}
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(t.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                      />
                      <button onClick={() => saveRename(t.id)} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setRenamingId(null)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-textMuted)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-textPrimary)' }}>{t.name}</span>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.active ? '#22c55e' : '#888', flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: 'var(--color-textMuted)' }}>{t.active ? 'Active' : 'Disabled'}</span>
                    </div>
                  )}
                  {!renamingId && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)', marginTop: 3 }}>
                      Created {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      {t.lastUsedAt ? ` · Last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : ''}
                    </div>
                  )}
                </div>
                {renamingId !== t.id && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setRenamingId(t.id); setRenameVal(t.name); }}
                      title="Rename"
                      style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)', color: 'var(--color-textMuted)', cursor: 'pointer', fontSize: 12 }}
                    >Rename</button>
                    <button
                      onClick={() => toggle(t.id)}
                      title={t.active ? 'Disable' : 'Enable'}
                      style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)', color: t.active ? '#f87171' : '#22c55e', cursor: 'pointer', fontSize: 12 }}
                    >{t.active ? 'Disable' : 'Enable'}</button>
                    <button
                      onClick={() => remove(t.id)}
                      title="Delete"
                      style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: 12 }}
                    >Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ZIP Upload ────────────────────────────────────────────────────────────────
function UploadTab({ projectId }) {
  const [tokens, setTokens] = useState([]);
  const [form, setForm] = useState({ tokenId: '', commitMessage: '', extraMessage: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    getCliTokens(projectId)
      .then((ts) => {
        const active = (ts || []).filter((t) => t.active);
        setTokens(active);
        if (active.length === 1) setForm((f) => ({ ...f, tokenId: String(active[0].id) }));
      })
      .catch(() => setTokens([]));
  }, [projectId]);

  function set(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

  async function handleUpload() {
    if (!file) return setError('Select a ZIP file to upload.');
    if (!form.tokenId) return setError('Select a CLI token.');
    if (!form.commitMessage.trim()) return setError('Enter a commit message.');
    setUploading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tokenId', form.tokenId);
      fd.append('commitMessage', form.commitMessage.trim());
      if (form.extraMessage.trim()) fd.append('extraMessage', form.extraMessage.trim());
      const res = await uploadZip(projectId, fd);
      setResult(res);
      setFile(null);
      setForm((f) => ({ ...f, commitMessage: '', extraMessage: '' }));
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  }

  return (
    <div>
      {result && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#22c55e', fontWeight: 500,
        }}>
          ZIP uploaded and review queued — commit #{result.id || ''}
        </div>
      )}

      {tokens.length === 0 && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#fbbf24',
        }}>
          You need an active CLI token to upload a ZIP. Go to the <strong>Tokens</strong> tab to generate one.
        </div>
      )}

      {/* Token select */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Select Token</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.tokenId}
          onChange={set('tokenId')}
          disabled={tokens.length === 0}
        >
          <option value="">— choose a token —</option>
          {tokens.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* File picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>ZIP File</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', border: `2px dashed ${file ? 'rgba(139,92,246,0.5)' : 'var(--color-border)'}`,
            borderRadius: 10, padding: '22px 16px', textAlign: 'center',
            background: file ? 'rgba(139,92,246,0.06)' : 'var(--color-bgMuted)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8b5cf6', marginBottom: 3 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-textMuted)' }}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
            </div>
          ) : (
            <div>
              <div style={{ color: 'var(--color-textMuted)', marginBottom: 6 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--color-textSecondary)', marginBottom: 2 }}>Click to select a ZIP file</div>
              <div style={{ fontSize: 12, color: 'var(--color-textMuted)' }}>or drag and drop</div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {/* Commit message */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Commit Message</label>
        <input
          style={inputStyle}
          placeholder="e.g. feat: add user authentication"
          value={form.commitMessage}
          onChange={set('commitMessage')}
        />
      </div>

      {/* Extra message */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Review Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5 }}
          placeholder="Any context for the AI reviewer…"
          value={form.extraMessage}
          onChange={set('extraMessage')}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          fontSize: 13, color: '#f87171',
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || tokens.length === 0}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: (uploading || tokens.length === 0) ? 'var(--color-bgMuted)' : '#8b5cf6',
          color: (uploading || tokens.length === 0) ? 'var(--color-textMuted)' : '#fff',
          fontSize: 14, fontWeight: 600, cursor: (uploading || tokens.length === 0) ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Uploading…' : 'Upload & Review'}
      </button>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function HistoryTab({ projectId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { load(0); }, [projectId]);

  async function load(p) {
    setLoading(true);
    try {
      const res = await getZipCommitHistory(projectId, p);
      setHistory(res?.content || []);
      setTotalPages(res?.totalPages || 1);
      setPage(p);
    } catch { setHistory([]); } finally { setLoading(false); }
  }

  if (loading) return <div style={{ fontSize: 13.5, color: 'var(--color-textMuted)' }}>Loading…</div>;
  if (!history.length) return (
    <div style={{
      padding: '32px', textAlign: 'center', background: 'var(--color-bgSurface)',
      border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, color: 'var(--color-textMuted)',
    }}>
      No commits yet. Upload a ZIP to start getting code reviews.
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {history.map((c) => (
          <div key={c.id} style={{
            background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '13px 16px',
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 4 }}>
              {c.commitMessage || 'No message'}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, color: 'var(--color-textMuted)' }}>
                {c.committedAt ? new Date(c.committedAt).toLocaleString() : ''}
              </span>
              {c.status && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
                  background: c.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                  color: c.status === 'COMPLETED' ? '#22c55e' : '#fbbf24',
                }}>
                  {c.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page === 0} onClick={() => load(page - 1)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)', color: 'var(--color-textMuted)', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>Previous</button>
          <span style={{ padding: '6px 10px', fontSize: 13, color: 'var(--color-textMuted)' }}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)', color: 'var(--color-textMuted)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>Next</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ZipProjectDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    getZipProject(id)
      .then(setProject)
      .catch(() => navigate('/user/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete project "${project?.title}"? This cannot be undone.`)) return;
    await deleteZipProject(id);
    navigate('/user/dashboard');
  }

  return (
    <UserDashboardLayout user={user}>
      {loading ? (
        <div style={{ fontSize: 14, color: 'var(--color-textMuted)' }}>Loading…</div>
      ) : project ? (
        <div style={{ maxWidth: 680 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => navigate('/user/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-textMuted)', fontSize: 13, padding: 0, marginBottom: 14,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              All Projects
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: '#8b5cf6',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 1 }}>{project.title}</h1>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>CLI / ZIP</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 22,
            background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
            borderRadius: 9, padding: 4,
          }}>
            {[['overview', 'Overview'], ['tokens', 'CLI Tokens'], ['upload', 'Upload ZIP'], ['history', 'Commit History']].map(([id, label]) => (
              <Tab key={id} id={id} label={label} active={activeTab === id} onClick={setActiveTab} />
            ))}
          </div>

          {activeTab === 'overview' && <OverviewTab project={project} onDelete={handleDelete} />}
          {activeTab === 'tokens' && <TokensTab projectId={id} />}
          {activeTab === 'upload' && <UploadTab projectId={id} />}
          {activeTab === 'history' && <HistoryTab projectId={id} />}
        </div>
      ) : null}
    </UserDashboardLayout>
  );
}
