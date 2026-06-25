import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import { useProjects } from '../../../context/ProjectContext';

export default function UserDashboardPage() {
  const { user } = useUser();
  const { projects, loading } = useProjects();

  return (
    <UserDashboardLayout user={user}>
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--color-textPrimary)' }}>
          Welcome back, {user.name.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 28 }}>
          Here's an overview of your projects.
        </p>

        {loading ? (
          <div style={{ color: 'var(--color-textMuted)', fontSize: 14 }}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={{
            background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: 'var(--color-textMuted)' }}>
              No projects yet. Click <strong style={{ color: 'var(--color-accent)' }}>New Project</strong> in the sidebar to add one.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projects.map(p => (
              <div key={p.id} style={{
                background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-textMuted)' }}>{p.provider || 'Repository'}</div>
                {p.webhookStatus && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.webhookStatus === 'ACTIVE' ? '#22c55e' : '#888' }} />
                    <span style={{ fontSize: 11, color: 'var(--color-textMuted)' }}>{p.webhookStatus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}
