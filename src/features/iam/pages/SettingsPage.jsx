import DashboardLayout from '../../../layouts/DashboardLayout';
import { toggleTheme } from '../../../theme';
import { useUser } from '../../../context/UserContext'; // ← CHANGED

export default function IamSettingsPage() {
  const { user } = useUser(); // ← CHANGED
  return (
    <DashboardLayout role="iam" user={user}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-textPrimary)' }}>Settings</h1>
      <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 24 }}>Manage your account preferences.</p>
      <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '20px', maxWidth: 480 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-textPrimary)' }}>Appearance</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-textPrimary)' }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 2 }}>Toggle between dark and light mode</div>
          </div>
          <button onClick={toggleTheme} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bgElevated)', color: 'var(--color-textPrimary)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Toggle Theme</button>
        </div>
      </div>
    </DashboardLayout>
  );
}