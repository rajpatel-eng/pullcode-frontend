/**
 * UserSidebar — project-centric sidebar for the user role.
 *
 * Layout (top → bottom, all fixed except projects):
 *  ┌─────────────────────────────┐
 *  │  PullCode logo              │  fixed
 *  ├─────────────────────────────┤
 *  │  [+ New Project]            │  fixed
 *  ├─────────────────────────────┤
 *  │  Projects (scrollable)      │  flex-1 + overflowY
 *  │    project card × N         │
 *  ├─────────────────────────────┤
 *  │  Profile menu (popup up)    │  fixed
 *  └─────────────────────────────┘
 *
 * Profile popup contains: Profile · Settings · Logout
 * Settings popup contains: Theme toggle (dark / light / system)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, tokenStorage } from '../../services/authService';
import { toggleTheme, getStoredTheme, applyTheme } from '../../theme';
import { useProjects } from '../../context/ProjectContext';
import { addRepository } from '../../services/repositoryService';

// ── helpers ───────────────────────────────────────────────────────────────────

function providerColor(provider) {
  if (!provider) return '#6366f1';
  const p = String(provider).toLowerCase();
  if (p.includes('github')) return '#e8eaf0';
  if (p.includes('gitlab')) return '#fc6d26';
  if (p.includes('bitbucket')) return '#2684ff';
  return '#6366f1';
}

function providerIcon(provider) {
  const p = String(provider || '').toLowerCase();
  if (p.includes('github')) return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
  if (p.includes('gitlab')) return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
    </svg>
  );
  if (p.includes('bitbucket')) return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  );
}

function Avatar({ name, src, size = 30 }) {
  const initials = (name || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: src ? 'transparent' : 'var(--color-accent)',
      border: src ? '1.5px solid var(--color-border)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  );
}

function getStoredUser() {
  const email = tokenStorage.getEmail() || '';
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User';
  return { name, email, photoUrl: null };
}

// ── Skeleton for loading ───────────────────────────────────────────────────────
function ProjectSkeleton() {
  return (
    <div style={{ padding: '8px 10px', marginBottom: 4 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 52, borderRadius: 8, marginBottom: 6,
          background: 'var(--color-bgElevated)',
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

// ── New Project Modal ──────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef(null);
  useEffect(() => { urlRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !repoUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const created = await addRepository({ title: title.trim(), repoUrl: repoUrl.trim(), accessToken: accessToken.trim() || undefined });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: 440, background: 'var(--color-bgSurface)',
        border: '1px solid var(--color-border)', borderRadius: 14,
        padding: '28px 28px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-textPrimary)' }}>New Project</div>
            <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 2 }}>Connect a GitHub, GitLab, or Bitbucket repo</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-textMuted)', padding: 4, borderRadius: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Project name', value: title, set: setTitle, placeholder: 'My awesome project', required: true, ref: null },
            { label: 'Repository URL', value: repoUrl, set: setRepoUrl, placeholder: 'https://github.com/org/repo', required: true, ref: urlRef },
            { label: 'Access token', value: accessToken, set: setAccessToken, placeholder: 'ghp_xxxx… (optional for private repos)', required: false, ref: null },
          ].map(({ label, value, set, placeholder, required, ref }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-textSecondary)', marginBottom: 5, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                {label}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
              </label>
              <input
                ref={ref}
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bgElevated)',
                  color: 'var(--color-textPrimary)', fontSize: 13.5,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-borderFocus)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px', borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bgElevated)',
                color: 'var(--color-textSecondary)', fontSize: 13.5,
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !repoUrl.trim()}
              style={{
                flex: 2, padding: '9px', borderRadius: 8,
                border: 'none',
                background: loading ? 'var(--color-bgElevated)' : 'var(--color-accent)',
                color: loading ? 'var(--color-textMuted)' : '#fff',
                fontSize: 13.5, cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Theme panel ────────────────────────────────────────────────────────────────
function ThemePanel({ onBack }) {
  const [current, setCurrent] = useState(getStoredTheme());

  function applyMode(mode) {
    
    applyTheme(mode);
    setCurrent(mode);
  }

  const themes = [
    {
      id: 'dark', label: 'Dark',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    },
    {
      id: 'light', label: 'Light',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-textSecondary)', fontSize: 12.5,
          padding: '4px 8px', borderRadius: 6, marginBottom: 8,
          fontWeight: 500,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px', marginBottom: 6 }}>Appearance</div>
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => applyMode(t.id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: current === t.id ? 'var(--color-navActiveBg)' : 'transparent',
            color: current === t.id ? 'var(--color-navActiveText)' : 'var(--color-textPrimary)',
            fontSize: 13.5, fontWeight: 500, marginBottom: 2, textAlign: 'left',
          }}
          onMouseEnter={e => { if (current !== t.id) e.currentTarget.style.background = 'var(--color-bgElevated)'; }}
          onMouseLeave={e => { if (current !== t.id) e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.icon}{t.label}</span>
          {current === t.id && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────────
export default function UserSidebar({ user: userProp }) {
  const user = (userProp && userProp.name) ? userProp : getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, loading } = useProjects();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const popupRef = useRef(null);
  const { refresh } = useProjects();

  // Close popup when clicking outside
  useEffect(() => {
    function handle(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setProfileOpen(false);
        setShowTheme(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [profileOpen]);

  // Close popup on navigation
  useEffect(() => {
    setProfileOpen(false);
    setShowTheme(false);
  }, [location.pathname]);

  const activeProjectId = location.pathname.match(/\/user\/projects\/(\d+)/)?.[1];

  function handleProjectCreated(proj) {
    refresh();
    navigate(`/user/projects/${proj.id}`);
  }

  return (
    <>
      <aside
        style={{
          width: 248,
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--color-bgSurface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden', // parent does NOT scroll; only project list does
        }}
      >
        {/* ── Logo ── */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                <path d="M11 18H8a2 2 0 0 1-2-2V9" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-textPrimary)', letterSpacing: '-0.2px' }}>PullCode</div>
              <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1 }}>Projects</div>
            </div>
          </div>
        </div>

        {/* ── New Project button (fixed) ── */}
        <div style={{ padding: '10px 10px 8px', flexShrink: 0 }}>
          <button
            onClick={() => setNewProjectOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 14px', borderRadius: 8,
              border: '1px dashed var(--color-borderFocus)',
              background: 'var(--color-accentSubtle)',
              color: 'var(--color-accent)',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accentSubtle)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Project
          </button>
        </div>

        {/* ── Section label ── */}
        <div style={{ padding: '4px 18px 6px', flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Projects</span>
            {!loading && <span style={{ fontWeight: 500, opacity: 0.7 }}>{projects.length}</span>}
          </div>
        </div>

        {/* ── Scrollable project list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', minHeight: 0 }}>
          {loading ? (
            <ProjectSkeleton />
          ) : projects.length === 0 ? (
            <div style={{ padding: '20px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--color-textMuted)', lineHeight: 1.6 }}>
                No projects yet.<br />Click <strong style={{ color: 'var(--color-accent)' }}>New Project</strong> to get started.
              </div>
            </div>
          ) : (
            projects.map(project => {
              const isActive = String(activeProjectId) === String(project.id);
              const pColor = providerColor(project.provider);
              return (
                <button
                  key={project.id}
                  onClick={() => navigate(`/user/projects/${project.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    marginBottom: 3,
                    background: isActive ? 'var(--color-navActiveBg)' : 'transparent',
                    color: isActive ? 'var(--color-navActiveText)' : 'var(--color-textSecondary)',
                    textAlign: 'left', transition: 'background 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bgElevated)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Provider dot */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: isActive ? 'rgba(59,130,246,0.2)' : 'var(--color-bgElevated)',
                    border: `1px solid ${isActive ? 'var(--color-borderFocus)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: pColor, flexShrink: 0,
                  }}>
                    {providerIcon(project.provider)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--color-navActiveText)' : 'var(--color-textPrimary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.provider || 'Repository'}
                    </div>
                  </div>
                  {/* Webhook status indicator */}
                  {project.webhookStatus && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: project.webhookStatus === 'ACTIVE' ? '#22c55e' : 'var(--color-textMuted)',
                    }} title={project.webhookStatus} />
                  )}
                </button>
              );
            })
          )}
          {/* bottom padding for scroll */}
          <div style={{ height: 8 }} />
        </div>

        {/* ── Profile section (fixed at bottom) ── */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--color-border)', flexShrink: 0, position: 'relative' }} ref={popupRef}>

          {/* Profile popup (opens upward) */}
          {profileOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 10, right: 10,
              background: 'var(--color-profileBg)',
              border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '6px', marginBottom: 6,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
            }}>
              {showTheme ? (
                <ThemePanel onBack={() => setShowTheme(false)} />
              ) : (
                <>
                  {/* User info header */}
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-textPrimary)' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1 }}>{user.email}</div>
                  </div>

                  {/* Profile */}
                  <MenuBtn
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
                    label="Profile"
                    onClick={() => navigate('/user/profile')}
                  />

                  {/* Settings (theme) */}
                  <MenuBtn
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}
                    label="Settings"
                    suffix={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>}
                    onClick={() => setShowTheme(true)}
                  />

                  {/* Logout */}
                  <MenuBtn
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
                    label="Logout"
                    danger
                    onClick={async () => { await logout(); navigate('/user/login'); }}
                  />
                </>
              )}
            </div>
          )}

          {/* Profile trigger button */}
          <button
            onClick={() => { setProfileOpen(o => !o); setShowTheme(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              background: profileOpen ? 'var(--color-bgElevated)' : 'var(--color-bgMuted)',
              color: 'var(--color-textPrimary)', textAlign: 'left', transition: 'background 0.15s',
            }}
          >
            <Avatar name={user.name} src={user.photoUrl} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-textPrimary)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1 }}>User</div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-textMuted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      {newProjectOpen && (
        <NewProjectModal
          onClose={() => setNewProjectOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

// ── Small reusable menu button ─────────────────────────────────────────────────
function MenuBtn({ icon, label, onClick, danger = false, suffix }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
        background: 'transparent',
        color: danger ? '#f87171' : 'var(--color-textPrimary)',
        fontSize: 13.5, fontWeight: 500, textAlign: 'left',
        justifyContent: 'flex-start',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.08)' : 'var(--color-bgElevated)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {suffix}
    </button>
  );
}
