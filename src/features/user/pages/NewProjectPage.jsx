import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import { useProjects } from '../../../context/ProjectContext';
import WebhookProjectForm from '../components/WebhookProjectForm';
import CliZipProjectForm from '../components/CliZipProjectForm';

const MODE_CARD = [
  {
    id: 'webhook',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    label: 'Webhook',
    sub: 'Auto-review on every push',
    providers: ['GitHub', 'GitLab', 'Bitbucket'],
    desc: 'Connect your git repository. We generate a webhook URL — code reviews happen automatically when you push.',
    accent: '#3b82f6',
  },
  {
    id: 'cli',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    label: 'CLI / ZIP Upload',
    sub: 'Push from terminal or upload a zip',
    providers: ['CLI', 'ZIP'],
    desc: 'Create a project, generate a CLI token, then push code with our CLI or upload a ZIP file from the browser.',
    accent: '#8b5cf6',
  },
];

export default function NewProjectPage() {
  const { user } = useUser();
  const { refresh } = useProjects();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'webhook' | 'cli'

  function handleCreated(project) {
    refresh();
    if (mode === 'webhook') {
      navigate(`/user/projects/${project.id}`);
    } else {
      navigate(`/user/zip-projects/${project.id}`);
    }
  }

  return (
    <UserDashboardLayout user={user}>
      <div style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          {mode && (
            <button
              onClick={() => setMode(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-textMuted)', fontSize: 13, padding: 0,
                marginBottom: 16,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 4 }}>
            New Project
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-textSecondary)' }}>
            {mode
              ? mode === 'webhook'
                ? 'Connect a repository via webhook for automatic code review on every push.'
                : 'Create a project and push code using our CLI or upload a ZIP file.'
              : 'Choose how you want to connect your codebase.'}
          </p>
        </div>

        {/* Mode selector */}
        {!mode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {MODE_CARD.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  background: 'var(--color-bgSurface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '22px 20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = m.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 1px ${m.accent}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ color: m.accent, marginBottom: 12 }}>{m.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginBottom: 12 }}>{m.sub}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)', lineHeight: 1.55, marginBottom: 14 }}>{m.desc}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {m.providers.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: `${m.accent}18`, color: m.accent,
                        border: `1px solid ${m.accent}30`,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-textMuted)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Forms */}
        {mode === 'webhook' && (
          <WebhookProjectForm onCreated={handleCreated} onCancel={() => setMode(null)} />
        )}
        {mode === 'cli' && (
          <CliZipProjectForm onCreated={handleCreated} onCancel={() => setMode(null)} />
        )}
      </div>
    </UserDashboardLayout>
  );
}
