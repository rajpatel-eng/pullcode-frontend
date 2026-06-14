import DashboardLayout from '../../../layouts/DashboardLayout';

const ADMIN_USER = { name: 'Elena Vasquez', email: 'elena@pullcode.io' };

const USERS = [
  { name: 'Alice Chen', email: 'alice@corp.io', role: 'Developer', status: 'Active' },
  { name: 'Bob Martinez', email: 'bob@corp.io', role: 'Reviewer', status: 'Active' },
  { name: 'Carol Kim', email: 'carol@corp.io', role: 'Viewer', status: 'Suspended' },
  { name: 'Dave Patel', email: 'dave@corp.io', role: 'Developer', status: 'Active' },
];

export default function IamManagementPage() {
  return (
    <DashboardLayout role="admin" user={ADMIN_USER}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>
        IAM Management
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 24 }}>
        Manage users, roles, and access policies.
      </p>

      <div
        style={{
          background: 'var(--color-bgSurface)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 120px 100px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--color-border)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-textMuted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {USERS.map((u, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px 100px',
              padding: '13px 20px',
              borderBottom: i < USERS.length - 1 ? '1px solid var(--color-border)' : 'none',
              fontSize: 13.5,
              color: 'var(--color-textPrimary)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 500 }}>{u.name}</span>
            <span style={{ color: 'var(--color-textSecondary)' }}>{u.email}</span>
            <span style={{ color: 'var(--color-textSecondary)' }}>{u.role}</span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 9px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: u.status === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                  color: u.status === 'Active' ? '#4ade80' : '#f87171',
                }}
              >
                {u.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
