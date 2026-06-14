import DashboardLayout from '../../../layouts/DashboardLayout';

const ADMIN_USER = { name: 'Elena Vasquez', email: 'elena@pullcode.io' };

const MODELS = [
  { name: 'GPT-4o', provider: 'OpenAI', status: 'Active', calls: '14,280' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'Active', calls: '9,041' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', status: 'Inactive', calls: '—' },
  { name: 'Mistral Large', provider: 'Mistral AI', status: 'Active', calls: '3,114' },
];

export default function AiModelsPage() {
  return (
    <DashboardLayout role="admin" user={ADMIN_USER}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
        AI Models
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 24 }}>
        Monitor and configure AI model deployments.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        {MODELS.map((m, i) => (
          <div
            key={i}
            style={{
              background: 'var(--color-bgSurface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-textPrimary)' }}>{m.name}</div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  background: m.status === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.15)',
                  color: m.status === 'Active' ? '#4ade80' : 'var(--color-textMuted)',
                }}
              >
                {m.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginBottom: 8 }}>{m.provider}</div>
            <div style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>
              <span style={{ color: 'var(--color-textMuted)', fontSize: 11 }}>API calls </span>
              {m.calls}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
