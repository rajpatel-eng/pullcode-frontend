import { useState, useEffect } from 'react';
import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import { iamGetProfile, iamChangePassword, iamUpdatePhoto } from '../../../services/profileService';
import { useSnackbar } from '../../../components/common/Snackbar';

export default function UserProfilePage() {
  const { user: ctxUser, refresh: refreshUser } = useUser();
  const { showSnackbar } = useSnackbar();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    iamGetProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!currentPw || !newPw) return;
    setSavingPw(true);
    try {
      await iamChangePassword(currentPw, newPw);
      showSnackbar('Password changed', 'success');
      setCurrentPw(''); setNewPw('');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  async function handlePhotoChange(file) {
    setPhotoUploading(true);
    try {
      const updated = await iamUpdatePhoto(file);
      setProfile(p => ({ ...p, photoUrl: updated?.photoUrl || updated?.avatarUrl || p?.photoUrl }));
      refreshUser();
      showSnackbar('Photo updated', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bgElevated)',
    color: 'var(--color-textPrimary)', fontSize: 13.5,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <UserDashboardLayout user={ctxUser}>
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--color-textPrimary)' }}>My Profile</h1>
        <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 28 }}>Manage your account information.</p>

        {loading ? (
          <div style={{ color: 'var(--color-textMuted)', fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Avatar + name */}
            <div style={{
              background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '20px 22px', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 18,
            }}>
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: profile?.photoUrl ? 'transparent' : 'var(--color-accent)',
                  border: '2px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', fontSize: 20, fontWeight: 700, color: '#fff',
                }}>
                  {profile?.photoUrl
                    ? <img src={profile.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (profile?.name || 'U')[0].toUpperCase()}
                </div>
                {photoUploading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handlePhotoChange(e.target.files[0])} />
              </label>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-textPrimary)' }}>{profile?.name || '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginTop: 2 }}>{profile?.email || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 4 }}>Click avatar to change photo</div>
              </div>
            </div>

            {/* Change password */}
            <div style={{
              background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '20px 22px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 16 }}>Change Password</div>
              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-textSecondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Current password</label>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-borderFocus)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-textSecondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>New password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-borderFocus)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')} />
                </div>
                <button type="submit" disabled={savingPw || !currentPw || !newPw} style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--color-accent)', color: '#fff',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  opacity: savingPw || !currentPw || !newPw ? 0.6 : 1,
                }}>
                  {savingPw ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </UserDashboardLayout>
  );
}
