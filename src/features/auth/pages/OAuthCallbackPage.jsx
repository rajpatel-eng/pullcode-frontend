import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback, tokenStorage } from '../../../services/authService';
import { applyTheme, getStoredTheme } from '../../../theme';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(getStoredTheme());
    const ok = handleOAuthCallback();
    if (ok) {
      const role = tokenStorage.getRole();
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } else {
      navigate('/user/login?error=oauth_failed', { replace: true });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bgBase)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>Completing sign in…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
