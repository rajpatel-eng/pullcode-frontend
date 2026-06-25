import { useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import { applyTheme, getStoredTheme } from '../theme';

// user prop shape: { name, email, photoUrl }
// photoUrl flows from ProfilePage → DashboardLayout → Sidebar → Avatar
export default function DashboardLayout({ role = 'admin', user, children }) {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bgBase)',
        color: 'var(--color-textPrimary)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Sidebar role={role} user={user} />  {/* photoUrl inside user reaches Sidebar automatically */}

      <main
        style={{
          flex: 1,
          padding: '28px 32px',
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}