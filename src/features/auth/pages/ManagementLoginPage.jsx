import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminVerifyOtp, tokenStorage } from '../../../services/authService';
import { applyTheme, getStoredTheme } from '../../../theme';

export default function ManagementLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    applyTheme(getStoredTheme());
    const r = tokenStorage.getRole();
    if (tokenStorage.isLoggedIn()) {
      if (r === 'admin') navigate('/admin/dashboard');
      else if (r === 'iam') navigate('/iam/dashboard');
    }
  }, []);

  async function handleStep1(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await adminLogin(email, password);
      setPreAuthToken(data.preAuthToken);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await adminVerifyOtp(preAuthToken, otp, role);
      navigate(role === 'admin' ? '/admin/dashboard' : '/iam/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)',
    color: 'var(--color-textPrimary)', fontSize: 14, outline: 'none',
  };

  const btnPrimary = {
    width: '100%', padding: '11px', borderRadius: 8, border: 'none',
    background: 'var(--color-accent)', color: '#fff', fontWeight: 600,
    fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bgBase)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" />
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-textPrimary)' }}>PullCode</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-textSecondary)' }}>Management Portal</div>
        </div>

        <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '28px' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sign in as</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['admin', 'iam'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 7,
                    border: role === r ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: role === r ? 'var(--color-accentSubtle)' : 'var(--color-bgMuted)',
                    color: role === r ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                    fontWeight: role === r ? 600 : 400, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {r === 'admin' ? '🛡 Admin' : '👤 IAM User'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '9px 12px', borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginBottom: 5, display: 'block' }}>Email</label>
                <input style={inputStyle} type="email" placeholder="admin@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginBottom: 5, display: 'block' }}>Password</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" style={btnPrimary} disabled={loading}>
                {loading ? 'Verifying…' : 'Continue →'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px', borderRadius: 8, background: 'var(--color-bgMuted)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginBottom: 2 }}>Two-factor verification</div>
                <div style={{ fontSize: 13, color: 'var(--color-textPrimary)' }}>
                  Enter the OTP sent to <strong>{email}</strong>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginBottom: 5, display: 'block' }}>One-Time Password</label>
                <input
                  style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" style={btnPrimary} disabled={loading}>
                {loading ? 'Verifying OTP…' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-textMuted)', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
                ← Back
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/user/login" style={{ fontSize: 13, color: 'var(--color-textMuted)', textDecoration: 'none' }}>
            ← User login
          </a>
        </div>
      </div>
    </div>
  );
}
