import DashboardLayout from '../../../layouts/DashboardLayout';

const IAM_USER = { name: 'Jordan Lee', email: 'jordan@corp.io' };

const MODELS = [
  { name: 'GPT-4o', provider: 'OpenAI', access: 'Granted' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', access: 'Granted' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', access: 'Restricted' },
  { name: 'Mistral Large', provider: 'Mistral AI', access: 'Granted' },
];

export default function IamAiModelsPage() {
  return (
    <DashboardLayout role="iam" user={IAM_USER}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
        AI Models
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 24 }}>
        Models available to your account.
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
                  background: m.access === 'Granted' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                  color: m.access === 'Granted' ? '#4ade80' : '#f87171',
                }}
              >
                {m.access}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-textMuted)' }}>{m.provider}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
