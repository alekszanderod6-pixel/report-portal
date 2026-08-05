'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, getCurrentProfile } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { showToast } from '@/components/Toast';

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving]   = useState(false);
  const [showC, setShowC]     = useState(false);
  const [showN, setShowN]     = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (next.length < 6)          { showToast('Password must be at least 6 characters', 'warning'); return; }
    if (next !== confirm)         { showToast('Passwords do not match', 'warning'); return; }

    setSaving(true);
    try {
      // Re-authenticate first with current password
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) { showToast('Current password is incorrect', 'error'); setSaving(false); return; }

      // Now update to new password
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      showToast('Password changed successfully!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  }

  const eyeIcon = (show) => show
    ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
    : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm fade-in"
        style={{ border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--navy)' }}>Change Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update your account password</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showC ? 'text' : 'password'}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                required
                placeholder="Your current password"
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowC(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={eyeIcon(showC)} />
                </svg>
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showN ? 'text' : 'password'}
                value={next}
                onChange={e => setNext(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowN(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={eyeIcon(showN)} />
                </svg>
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat new password"
              className="input"
              style={confirm && confirm !== next ? { borderColor: 'var(--danger)' } : {}}
            />
            {confirm && confirm !== next && (
              <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Passwords do not match</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [profile, setProfile]           = useState(null);
  const [open, setOpen]                 = useState(false);       // mobile menu
  const [dropOpen, setDropOpen]         = useState(false);       // profile dropdown
  const [showChangePwd, setShowChangePwd] = useState(false);     // modal
  const router   = useRouter();
  const pathname = usePathname();
  const dropRef  = useRef(null);

  useEffect(() => {
    getCurrentProfile().then(setProfile);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() =>
      getCurrentProfile().then(setProfile)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setOpen(false);
    setDropOpen(false);
  };

  const links = [
    { href: '/dashboard',    label: 'Dashboard',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/report',       label: 'New Report',  icon: 'M12 4v16m8-8H4' },
    { href: '/overtime/list',label: 'Overtime',     icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
  if (profile?.role === 'admin')
    links.push({ href: '/admin', label: 'Admin Panel', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' });

  const active = (h) => {
    if (h === '/overtime/list') return pathname.startsWith('/overtime');
    return pathname === h || (h !== '/' && pathname.startsWith(h));
  };

  return (
    <>
      <nav style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(232,146,11,0.15)', boxShadow: '0 2px 16px rgba(0,0,0,0.18)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <div style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #f5a623 100%)', boxShadow: '0 2px 8px rgba(232,146,11,0.35)' }}
                className="w-9 h-9 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm font-display">CI</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-display font-bold text-sm leading-tight">C&I Report Portal</div>
                <div className="text-gray-500 text-xs">Maintenance Department</div>
              </div>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <button key={l.href} onClick={() => router.push(l.href)}
                  className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' + (active(l.href) ? 'text-amber-400 bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={l.icon} />
                  </svg>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Right side: profile dropdown + mobile burger */}
            <div className="flex items-center gap-2">

              {/* Profile dropdown (desktop) */}
              {profile && (
                <div className="relative hidden sm:block" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(232,146,11,0.2)', color: '#FBBF24' }}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-gray-300 text-sm">{profile.name}</span>
                    {profile.role === 'admin' && <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Admin</span>}
                    <svg className={'w-3.5 h-3.5 text-gray-400 transition-transform ' + (dropOpen ? 'rotate-180' : '')}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {dropOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl fade-in"
                      style={{ border: '1px solid var(--border)', zIndex: 60 }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold text-gray-800 truncate">{profile.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{profile.role}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setDropOpen(false); setShowChangePwd(true); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          Change Password
                        </button>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors text-left"
                          style={{ color: 'var(--danger)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile burger */}
              <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300 p-1.5 rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {open && (
            <div className="md:hidden pb-3 border-t border-white/10 pt-2 fade-in">
              {profile && (
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(232,146,11,0.2)', color: '#FBBF24' }}>
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-white text-sm">{profile.name}</span>
                  {profile.role === 'admin' && <span className="badge badge-warning text-xs">Admin</span>}
                </div>
              )}
              {links.map((l) => (
                <button key={l.href} onClick={() => { router.push(l.href); setOpen(false); }}
                  className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ' + (active(l.href) ? 'text-amber-400 bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={l.icon} />
                  </svg>
                  {l.label}
                </button>
              ))}
              {/* Mobile change password */}
              <button
                onClick={() => { setOpen(false); setShowChangePwd(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left text-gray-300 hover:text-white hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Change Password
              </button>
              <button onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left hover:bg-red-900/20"
                style={{ color: '#FCA5A5' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Change Password Modal */}
      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </>
  );
}
