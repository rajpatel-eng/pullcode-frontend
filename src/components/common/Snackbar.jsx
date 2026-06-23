import { createContext, useCallback, useContext, useRef, useState } from 'react';

const SnackbarContext = createContext(null);

const TYPE_STYLES = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: '#4ade80' },
  error: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', color: '#f87171' },
  info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: '#60a5fa' },
  warning: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', color: '#fbbf24' },
};

function Icon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'success') {
    return <svg {...common} stroke="#4ade80"><path d="M20 6 9 17l-5-5" /></svg>;
  }
  if (type === 'error') {
    return <svg {...common} stroke="#f87171"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  }
  if (type === 'warning') {
    return <svg {...common} stroke="#fbbf24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
  }
  return <svg {...common} stroke="#60a5fa"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
}

export function SnackbarProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const showSnackbar = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, duration);
  }, []);

  const dismiss = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
        }}
      >
        {items.map((it) => {
          const s = TYPE_STYLES[it.type] || TYPE_STYLES.info;
          return (
            <div
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 260,
                maxWidth: 380,
                background: 'var(--color-bgSurface)',
                border: `1px solid ${s.border}`,
                borderRadius: 10,
                padding: '12px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                fontSize: 13.5,
                color: 'var(--color-textPrimary)',
                animation: 'snackbar-in 0.18s ease-out',
              }}
            >
              <Icon type={it.type} />
              <div style={{ flex: 1 }}>{it.message}</div>
              <button
                onClick={() => dismiss(it.id)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--color-textMuted)', fontSize: 16, lineHeight: 1, padding: 0,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes snackbar-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return ctx;
}
