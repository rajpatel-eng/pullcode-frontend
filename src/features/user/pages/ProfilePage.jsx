import { useState, useEffect, useRef } from 'react';
import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import { useSnackbar } from '../../../components/common/Snackbar';
import {
  userGetProfile,
  userUpdateName,
  userChangePassword,
  userUpdatePhoto,
} from '../../../services/profileService';

// ── Design primitives ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-textSecondary)', marginBottom: 6, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
      {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder = '', disabled = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: `1px solid ${focused ? 'var(--color-borderFocus)' : 'var(--color-border)'}`,
        background: disabled ? 'var(--color-bgMuted)' : 'var(--color-bgBase)',
        color: disabled ? 'var(--color-textMuted)' : 'var(--color-textPrimary)',
        fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s', cursor: disabled ? 'default' : 'text',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function PrimaryBtn({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        padding: '9px 22px', borderRadius: 8, border: 'none',
        background: loading || disabled ? 'var(--color-bgElevated)' : 'var(--color-accent)',
        color: loading || disabled ? 'var(--color-textMuted)' : '#fff',
        fontSize: 13.5, fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  );
}

function Card({ title, subtitle, children, style: extra = {} }) {
  return (
    <div style={{
      background: 'var(--color-bgSurface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      ...extra,
    }}>
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bgElevated)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-textPrimary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

function StatPill({ label, value, accent = false }) {
  return (
    <div style={{
      flex: 1,
      background: accent ? 'var(--color-accentSubtle)' : 'var(--color-bgElevated)',
      border: `1px solid ${accent ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
      borderRadius: 10, padding: '16px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ? 'var(--color-accent)' : 'var(--color-textPrimary)', letterSpacing: '-0.5px' }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Avatar with hover-to-change overlay ──────────────────────────────────────

function AvatarUpload({ src, name, onFileChange, uploading }) {
  const inputRef = useRef();
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: src ? 'transparent' : 'var(--color-accent)',
        border: '3px solid var(--color-border)',
        overflow: 'hidden', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff',
      }}>
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          opacity: uploading ? 1 : 0, cursor: uploading ? 'default' : 'pointer',
          transition: 'opacity 0.18s',
        }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = 1; }}
        onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = 0; }}
      >
        {uploading
          ? <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.3px' }}>CHANGE</span>
            </>
          )
        }
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Two-column layout helper ──────────────────────────────────────────────────

function TwoCol({ left, right }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { user: ctxUser, setUser } = useUser();
  const { showSnackbar } = useSnackbar();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Name edit
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Photo
  const [photoUploading, setPhotoUploading] = useState(false);

  // Load profile on mount — real API call
  useEffect(() => {
    userGetProfile()
      .then(data => {
        setProfile(data);
        setName(data.name || '');
        // Keep sidebar in sync
        setUser(u => ({
          ...u,
          name: data.name,
          email: data.email,
          photoUrl: data.avatarUrl || data.photoUrl || u.photoUrl,
        }));
      })
      .catch(err => showSnackbar(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleNameSave() {
    if (!name.trim() || name.trim() === profile?.name) return;
    setSavingName(true);
    try {
      const updated = await userUpdateName(name.trim());
      setProfile(updated);
      setName(updated.name);
      setUser(u => ({ ...u, name: updated.name }));
      showSnackbar('Name updated', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePhotoChange(file) {
    setPhotoUploading(true);
    try {
      const updated = await userUpdatePhoto(file);
      const photoUrl = updated?.avatarUrl || updated?.photoUrl || null;
      setProfile(p => ({ ...p, avatarUrl: photoUrl }));
      setUser(u => ({ ...u, photoUrl }));
      showSnackbar('Photo updated', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handlePasswordSave() {
    if (!oldPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) { showSnackbar('New passwords do not match', 'error'); return; }
    if (newPw.length < 8) { showSnackbar('New password must be at least 8 characters', 'error'); return; }
    setSavingPw(true);
    try {
      await userChangePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setConfirmPw('');
      showSnackbar('Password changed successfully', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  const isOAuth = profile?.authProvider && profile.authProvider !== 'LOCAL';
  const nameChanged = name.trim() !== (profile?.name || '');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <UserDashboardLayout user={ctxUser}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 4 }}>
          Profile
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--color-textSecondary)' }}>
          Manage your account information, photo, and security settings.
        </p>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── Row 1: Identity + Stats ── */}
          <TwoCol
            left={
              <Card title="Your account" subtitle="Public-facing name and profile photo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                  <AvatarUpload
                    src={profile?.avatarUrl}
                    name={profile?.name}
                    onFileChange={handlePhotoChange}
                    uploading={photoUploading}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.name || '—'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.email}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--color-accentSubtle)', color: 'var(--color-accent)' }}>
                        USER
                      </span>
                      {profile?.authProvider && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--color-bgElevated)', color: 'var(--color-textSecondary)', border: '1px solid var(--color-border)' }}>
                          {profile.authProvider === 'LOCAL' ? '🔑 Email' : `🔗 ${profile.authProvider}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Hover over your photo to change it. JPG, PNG, GIF, or WebP · max 5 MB.
                </div>
              </Card>
            }
            right={
              <Card title="Activity" subtitle="Your code review activity">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <StatPill label="Webhook reviews" value={profile?.webhookReviews ?? 0} />
                    <StatPill label="Project commits" value={profile?.projectCommits ?? 0} />
                  </div>
                  <StatPill label="Total reviews" value={profile?.totalReviews ?? 0} accent />
                </div>
              </Card>
            }
          />

          {/* ── Row 2: Display name + Email ── */}
          <TwoCol
            left={
              <Card title="Display name" subtitle="How your name appears across the app">
                <div style={{ marginBottom: 14 }}>
                  <Label required>Full name</Label>
                  <Input value={name} onChange={setName} placeholder="Your full name" />
                </div>
                <PrimaryBtn onClick={handleNameSave} loading={savingName} disabled={!nameChanged || !name.trim()}>
                  Save name
                </PrimaryBtn>
              </Card>
            }
            right={
              <Card title="Email address" subtitle="Your login email cannot be changed here">
                <div style={{ marginBottom: 14 }}>
                  <Label>Email</Label>
                  <Input value={profile?.email || ''} onChange={() => {}} disabled />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Contact support to change your email address.
                </div>
              </Card>
            }
          />

          {/* ── Row 3: Change password — full width ── */}
          <Card
            title="Change password"
            subtitle={isOAuth
              ? `You signed in with ${profile.authProvider} — password login is not available`
              : 'Must be at least 8 characters'}
          >
            {isOAuth ? (
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'var(--color-bgElevated)', border: '1px solid var(--color-border)',
                fontSize: 13, color: 'var(--color-textMuted)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Your account uses {profile.authProvider} sign-in. Password changes are managed through your {profile.authProvider} account.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
                <div>
                  <Label required>Current password</Label>
                  <Input value={oldPw} onChange={setOldPw} type={showPw ? 'text' : 'password'} placeholder="Current password" />
                </div>
                <div>
                  <Label required>New password</Label>
                  <Input value={newPw} onChange={setNewPw} type={showPw ? 'text' : 'password'} placeholder="At least 8 characters" />
                </div>
                <div>
                  <Label required>Confirm new password</Label>
                  <Input value={confirmPw} onChange={setConfirmPw} type={showPw ? 'text' : 'password'} placeholder="Repeat new password" />
                  {confirmPw && newPw !== confirmPw && (
                    <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 5 }}>Passwords do not match</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, gridColumn: '1 / -1', marginTop: 4 }}>
                  <PrimaryBtn
                    onClick={handlePasswordSave}
                    loading={savingPw}
                    disabled={!oldPw || !newPw || !confirmPw || newPw !== confirmPw}
                  >
                    Update password
                  </PrimaryBtn>
                  <button
                    onClick={() => setShowPw(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-textMuted)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {showPw
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                    {showPw ? 'Hide' : 'Show'} passwords
                  </button>
                </div>
              </div>
            )}
          </Card>

        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </UserDashboardLayout>
  );
}
