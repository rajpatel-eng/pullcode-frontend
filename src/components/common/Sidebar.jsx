import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = {
  admin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'iam',
      label: 'IAM Management',
      path: '/admin/iam',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          <circle cx="18" cy="6" r="2.5" />
          <path d="M21 10.5c1 .4 1.5 1.2 1.5 2" />
        </svg>
      ),
    },
    {
      id: 'ai',
      label: 'AI Models',
      path: '/admin/ai-models',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
          <path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ],

  iam: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/iam/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'ai',
      label: 'AI Models',
      path: '/iam/ai-models',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
          <path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/iam/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ],
};

function Avatar({ name, size = 32 }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function Sidebar({ role = 'admin', user = { name: 'Elena Vasquez', email: 'elena@pullcode.io' } }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const navItems = NAV[role] || NAV.admin;

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      style={{
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--color-bgSurface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand icon */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M13 6h3a2 2 0 0 1 2 2v7" />
              <path d="M11 18H8a2 2 0 0 1-2-2V9" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-textPrimary)', letterSpacing: '-0.2px' }}>
              PullCode
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1 }}>Enterprise</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 2,
                background: active ? 'var(--color-navActiveBg)' : 'transparent',
                color: active ? 'var(--color-navActiveText)' : 'var(--color-textSecondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--color-bgElevated)';
                  e.currentTarget.style.color = 'var(--color-textPrimary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-textSecondary)';
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--color-border)' }}>
        {/* Expandable panel */}
        {profileOpen && (
          <div
            style={{
              background: 'var(--color-profileBg)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: '6px',
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => navigate(`/${role}/profile`)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 10px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--color-textPrimary)',
                fontSize: 13.5,
                fontWeight: 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bgElevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              Profile
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 10px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#f87171',
                fontSize: 13.5,
                fontWeight: 500,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}

        <button
          onClick={() => setProfileOpen((o) => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            background: profileOpen ? 'var(--color-bgElevated)' : 'var(--color-bgMuted)',
            color: 'var(--color-textPrimary)',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
        >
          <Avatar name={user.name} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-textPrimary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 1 }}>
              {role === 'admin' ? 'Admin' : 'IAM User'}
            </div>
          </div>
          {/* Chevron */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-textMuted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
