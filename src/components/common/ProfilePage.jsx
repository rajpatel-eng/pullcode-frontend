/**
 * ProfilePage — shared by Admin and IAM.
 * Reads & updates user from UserContext so photo updates reflect
 * immediately in the sidebar bottom-left on all pages.
 */
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useUser } from '../../context/UserContext'; // ← CHANGED

function inputStyle(focused) {
  return {
    width: '100%', padding: '9px 12px',
    background: 'var(--color-bgBase)',
    border: `1px solid ${focused ? 'var(--color-borderFocus)' : 'var(--color-border)'}`,
    borderRadius: 8, color: 'var(--color-textPrimary)',
    fontSize: 13.5, outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-textSecondary)', marginBottom: 6, letterSpacing: 0.3 }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle(focused)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  );
}

function Btn({ onClick, loading, children, variant = 'primary', style: extra = {} }) {
  const base = { padding: '9px 20px', borderRadius: 8, border: 'none', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'background 0.15s, opacity 0.15s', ...extra };
  const vars = variant === 'primary'
    ? { background: 'var(--color-accent)', color: '#fff' }
    : variant === 'ghost'
    ? { background: 'var(--color-bgElevated)', color: 'var(--color-textSecondary)', border: '1px solid var(--color-border)' }
    : { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' };
  return <button onClick={onClick} disabled={loading} style={{ ...base, ...vars }}>{loading ? 'Saving…' : children}</button>;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Avatar({ src, name, onFileChange, uploading }) {
  const inputRef = useRef();
  const initials = (name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: src ? 'transparent' : 'var(--color-accentSubtle)', border: '2px solid var(--color-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)', position: 'relative' }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        <div onClick={() => !uploading && inputRef.current?.click()}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, opacity: 0, cursor: 'pointer', transition: 'opacity 0.18s', borderRadius: '50%' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}>
          {uploading
            ? <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg><span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>Change</span></>)}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }} />
    </div>
  );
}

function ExpandSection({ label, icon, open, onToggle, children }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: open ? 'var(--color-bgElevated)' : 'var(--color-bgSurface)', border: 'none', cursor: 'pointer', color: 'var(--color-textPrimary)', fontSize: 14, fontWeight: 600, transition: 'background 0.15s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon}{label}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-textMuted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <div style={{ maxHeight: open ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
        <div style={{ padding: '18px 18px 20px', background: 'var(--color-bgSurface)' }}>{children}</div>
      </div>
    </div>
  );
}

function extractPhotoUrl(data) {
  return data?.avatarUrl || data?.profilePhotoUrl || data?.photoUrl || null;
}

// ── Snackbar (inline — avoids prop-drilling) ──────────────────────────────────
import { useSnackbar } from './Snackbar';

export default function ProfilePage({ role, getProfile, updateName, changePassword, updatePhoto }) {
  const { showSnackbar } = useSnackbar();
  const { user: ctxUser, setUser } = useUser(); // ← CHANGED: read & write context

  const [profile, setProfile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [pwOpen,   setPwOpen]   = useState(false);
  const [newName,  setNewName]  = useState('');
  const [savingName, setSavingName] = useState(false);
  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => {
        const photoUrl = extractPhotoUrl(data);
        setProfile({ ...data, photoUrl });
        setNewName(data.name || '');
        // ← CHANGED: sync context so sidebar updates on other pages too
        setUser((u) => ({ ...u, name: data.name, email: data.email, photoUrl }));
      })
      .catch((err) => showSnackbar(err.message, 'error'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePhotoChange(file) {
    setPhotoUploading(true);
    try {
      const res = await updatePhoto(file);
      const photoUrl = extractPhotoUrl(res);
      setProfile((p) => ({ ...p, photoUrl }));
      // ← CHANGED: push new photo into context → sidebar updates immediately everywhere
      setUser((u) => ({ ...u, photoUrl }));
      showSnackbar('Profile photo updated!', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleNameSave() {
    if (!newName.trim()) return showSnackbar('Name cannot be empty', 'warning');
    setSavingName(true);
    try {
      await updateName(newName.trim());
      setProfile((p) => ({ ...p, name: newName.trim() }));
      // ← CHANGED: push new name into context
      setUser((u) => ({ ...u, name: newName.trim() }));
      showSnackbar('Name updated!', 'success');
      setNameOpen(false);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSave() {
    if (!curPw || !newPw || !confPw) return showSnackbar('Please fill all password fields', 'warning');
    if (newPw !== confPw) return showSnackbar('New passwords do not match', 'warning');
    if (newPw.length < 8) return showSnackbar('Password must be at least 8 characters', 'warning'); // matches backend @Size(min=8)
    setSavingPw(true);
    try {
      await changePassword(curPw, newPw, confPw);
      showSnackbar('Password changed successfully!', 'success');
      setCurPw(''); setNewPw(''); setConfPw('');
      setPwOpen(false);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  // ← CHANGED: use ctxUser (always up-to-date) as layoutUser so sidebar shows current photo
  return (
    <DashboardLayout role={role} user={ctxUser}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--color-textPrimary)' }}>My Profile</h1>
      <p style={{ fontSize: 14, color: 'var(--color-textSecondary)', marginBottom: 28 }}>Manage your account information and security settings.</p>

      {loading ? <Spinner /> : (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '24px 24px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Avatar src={profile?.photoUrl} name={profile?.name} onFileChange={handlePhotoChange} uploading={photoUploading} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name || '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || '—'}</div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: 'var(--color-accentSubtle)', color: 'var(--color-accent)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {role === 'admin' ? 'Administrator' : 'IAM User'}
              </span>
            </div>
          </div>

          <div>
            {updateName && (
              <ExpandSection label="Edit Profile Name" open={nameOpen}
                onToggle={() => { setNameOpen((v) => !v); if (pwOpen) setPwOpen(false); }}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}>
                <Field label="Display Name" value={newName} onChange={setNewName} placeholder="Enter your name" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={handleNameSave} loading={savingName}>Save Name</Btn>
                  <Btn variant="ghost" onClick={() => { setNameOpen(false); setNewName(profile?.name || ''); }}>Cancel</Btn>
                </div>
              </ExpandSection>
            )}

            <ExpandSection label="Change Password" open={pwOpen}
              onToggle={() => { setPwOpen((v) => !v); if (nameOpen) setNameOpen(false); }}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}>
              <Field label="Current Password" type="password" value={curPw} onChange={setCurPw} placeholder="Enter current password" />
              <Field label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="Min 8 characters" />
              <Field label="Confirm New Password" type="password" value={confPw} onChange={setConfPw} placeholder="Confirm new password" />
              {newPw && confPw && newPw !== confPw && (
                <div style={{ fontSize: 12, color: '#f87171', marginBottom: 14, marginTop: -8 }}>Passwords do not match</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={handlePasswordSave} loading={savingPw}>Update Password</Btn>
                <Btn variant="ghost" onClick={() => { setPwOpen(false); setCurPw(''); setNewPw(''); setConfPw(''); }}>Cancel</Btn>
              </div>
            </ExpandSection>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}