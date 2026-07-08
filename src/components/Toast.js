'use client';

import { useState, useEffect, useCallback } from 'react';

let toastId = 0;
const listeners = new Set();

function addToast(toast) {
  const id = ++toastId;
  const t = { id, ...toast, createdAt: Date.now() };
  listeners.forEach((fn) => fn(t));
  return id;
}

export function showToast(message, type = 'info', duration = 4000) {
  return addToast({ message, type, duration });
}

const STYLES = {
  success: { bg: '#065F46', border: '#10B981', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  error:   { bg: '#991B1B', border: '#EF4444', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  warning: { bg: '#92400E', border: '#F59E0B', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  info:    { bg: '#1E40AF', border: '#3B82F6', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const handler = useCallback((t) => {
    setToasts((p) => [...p, t]);
    setTimeout(() => {
      setToasts((p) => p.map((x) => (x.id === t.id ? { ...x, exiting: true } : x)));
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 300);
    }, t.duration || 4000);
  }, []);

  useEffect(() => {
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [handler]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            className={t.exiting ? 'toast-exit' : 'toast-enter' + ' pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm'}
            style={{ background: s.bg, borderLeft: '4px solid ' + s.border }}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
            </svg>
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
