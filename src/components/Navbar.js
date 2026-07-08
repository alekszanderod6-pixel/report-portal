'use client';

import { useState, useEffect } from 'react';
import { supabase, getCurrentProfile } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    getCurrentProfile().then(setProfile);
    const { data: { sub } } = supabase.auth.onAuthStateChange(() =>
      getCurrentProfile().then(setProfile)
    );
    return () => sub.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setOpen(false);
  };

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/report', label: 'New Report', icon: 'M12 4v16m8-8H4' },
  ];
  if (profile && profile.role === 'admin')
    links.push({ href: '/admin', label: 'Admin Panel', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' });

  const active = (h) => path === h || (h !== '/' && path.startsWith(h));

  return (
    <nav style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(232,146,11,0.2)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div style={{ background: 'var(--accent)' }} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-display">CI</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-display font-bold text-sm leading-tight">C&I Report Portal</div>
              <div className="text-gray-400 text-xs">Maintenance Department</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button key={l.href} onClick={() => router.push(l.href)}
                className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' + (active(l.href) ? 'text-amber-400 bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={l.icon} /></svg>
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(232,146,11,0.2)', color: '#FBBF24' }}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-gray-300 text-sm">{profile.name}</span>
                {profile.role === 'admin' && <span className="badge badge-warning text-xs">Admin</span>}
              </div>
            )}
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5" title="Logout">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            </button>
            <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300 p-1.5 rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden pb-3 border-t border-white/10 pt-2 fade-in">
            {profile && (
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(232,146,11,0.2)', color: '#FBBF24' }}>{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}</div>
                <span className="text-white text-sm">{profile.name}</span>
                {profile.role === 'admin' && <span className="badge badge-warning text-xs">Admin</span>}
              </div>
            )}
            {links.map((l) => (
              <button key={l.href} onClick={() => { router.push(l.href); setOpen(false); }}
                className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ' + (active(l.href) ? 'text-amber-400 bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={l.icon} /></svg>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
