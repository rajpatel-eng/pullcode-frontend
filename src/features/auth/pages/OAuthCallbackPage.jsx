import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback, tokenStorage } from '../../../services/authService';
import { applyTheme, getStoredTheme } from '../../../theme';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    applyTheme(getStoredTheme());

    const params = new URLSearchParams(window.location.search);

    // Backend failure sends ?error=...
    const backendError = params.get('error');
    if (backendError) {
      setErrorMsg(decodeURIComponent(backendError));
      setStatus('error');
      setTimeout(() => navigate('/user/login?error=oauth_failed', { replace: true }), 2500);
      return;
    }

    const ok = handleOAuthCallback();

    if (ok) {
      // Use full-page replace so localStorage is fully committed before
      // any React provider mounts and fires API calls.
      window.location.replace('/user/dashboard');
    } else {
      // No query params — old backend may have already redirected straight to
      // /user/dashboard and somehow bounced back here. If we already have tokens,
      // just go to dashboard. Otherwise show error.
      if (tokenStorage.isLoggedIn()) {
        window.location.replace('/user/dashboard');
      } else {
        console.error(
          '[OAuthCallback] No tokens in URL and none in storage.\n' +
          'URL was:', window.location.href, '\n' +
          'Backend should redirect to: <origin>/login-success?token=...&refreshToken=...&email=...\n' +
          'Check OAuth2AuthenticationSuccessHandler.java'
        );
        setErrorMsg('Sign-in could not be completed. Returning to login…');
        setStatus('error');
        setTimeout(() => navigate('/user/login?error=oauth_failed', { replace: true }), 2500);
      }
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bgBase)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 340, padding: '0 24px' }}>
        {status === 'loading' ? (
          <>
            <div style={{
              width: 44, height: 44,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 18px',
            }} />
            <div style={{ color: 'var(--color-textPrimary)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Completing sign in…
            </div>
            <div style={{ color: 'var(--color-textSecondary)', fontSize: 13 }}>
              Please wait while we set up your session.
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(248,113,113,0.12)',
              border: '2px solid rgba(248,113,113,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div style={{ color: 'var(--color-textPrimary)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Sign-in failed
            </div>
            <div style={{ color: 'var(--color-textSecondary)', fontSize: 13 }}>
              {errorMsg || 'Returning to login page…'}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
