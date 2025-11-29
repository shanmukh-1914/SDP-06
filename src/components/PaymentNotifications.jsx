import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

function formatDate(d) {
  try { return new Date(d).toLocaleString(); } catch (e) { return d; }
}

export default function PaymentNotifications() {
  // No options -> uses window.__MF_NOTIFICATIONS_WS or localStorage
  const { connected, notifications, markRead, markAllRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef(null);
  const navigate = useNavigate();
  const sequenceTimerRef = useRef([]);

  // Only show active notifications (not scheduled future reminders)
  const activeNotifications = notifications.filter(n => n.status !== 'scheduled');

  // When a new active notification arrives, show a transient popup (toast)
  const prevCountRef = useRef(activeNotifications.length);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (activeNotifications.length > prev) {
      const newest = activeNotifications[0];
      if (newest) {
        setToast(newest);
        setShowToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowToast(false), 10000); // auto-hide after 10s
      }
    }
    prevCountRef.current = activeNotifications.length;
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [activeNotifications]);

  // Show unread active notifications as popups when user logs in
  useEffect(() => {
    function showSequence(notifs) {
      // clear any existing timers
      sequenceTimerRef.current.forEach(id => clearTimeout(id));
      sequenceTimerRef.current = [];
      let delay = 0;
      notifs.forEach((n, idx) => {
        const t1 = setTimeout(() => {
          setToast(n);
          setShowToast(true);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setShowToast(false), 6000);
        }, delay);
        sequenceTimerRef.current.push(t1);
        delay += 7000; // show next after 7s
      });
    }

    function handleAuthEvent() {
      try {
        const unreadActive = activeNotifications.filter(n => !n.read);
        if (unreadActive.length > 0) showSequence(unreadActive);
      } catch (e) { /* ignore */ }
    }

    // Listen for explicit auth change event and storage changes to mf_current_user
    window.addEventListener('mf_auth_change', handleAuthEvent);
    function onStorage(e) {
      if (e.key === 'mf_current_user') handleAuthEvent();
    }
    window.addEventListener('storage', onStorage);

    // Also run once on mount if a user is present (show unread immediately)
    try { if (localStorage.getItem('mf_current_user')) handleAuthEvent(); } catch (e) {}

    return () => {
      window.removeEventListener('mf_auth_change', handleAuthEvent);
      window.removeEventListener('storage', onStorage);
      sequenceTimerRef.current.forEach(id => clearTimeout(id));
      sequenceTimerRef.current = [];
    };
  }, [activeNotifications]);

  const unreadCount = useMemo(() => activeNotifications.filter(n => !n.read).length, [activeNotifications]);

  return (
    <div style={{ position: 'relative', marginLeft: 12 }}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -10,
              background: '#ef4444',
              color: 'white',
              borderRadius: 999,
              padding: '2px 6px',
              fontSize: 12,
            }}>{unreadCount}</span>
          )}
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 36,
          width: 320,
          maxHeight: 360,
          overflow: 'auto',
          background: 'white',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          borderRadius: 8,
          zIndex: 9999,
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <small style={{ color: connected ? '#16a34a' : '#6b7280' }}>{connected ? 'Live' : 'Offline'}</small>
              <button onClick={() => markAllRead()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb' }}>Mark all read</button>
              <button onClick={() => navigate('/scheduled-reminders')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb' }}>Scheduled</button>
            </div>
          </div>
          {activeNotifications.length === 0 ? (
            <div style={{ padding: 12, color: '#374151' }}>No notifications</div>
          ) : (
            activeNotifications.map((n) => (
              <div key={n.id} style={{ padding: 12, borderBottom: '1px solid #f3f4f6', background: n.read ? 'white' : '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{n.title || (n.type === 'payment_reminder' ? 'Payment Reminder' : 'Notification')}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(n.dueDate || n.scheduledAt || n.date || n.timestamp)}</div>
                </div>
                <div style={{ marginTop: 6, color: '#374151' }}>{n.body || n.message || ''}</div>
                {n.amount && <div style={{ marginTop: 6, fontWeight: 700 }}>Amount: ₹{n.amount}</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => removeNotification(n.id)} style={{ border: 'none', background: '#ef4444', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Dismiss</button>
                  <button onClick={() => navigate('/payment-reminder', { state: { notification: n } })} style={{ border: 'none', background: '#2563eb', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Open</button>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} style={{ border: 'none', background: '#10b981', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Mark read</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Transient toast popup */}
      {showToast && toast && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 99999 }}>
          <div style={{ minWidth: 300, background: 'white', boxShadow: '0 6px 20px rgba(0,0,0,0.16)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{toast.title || 'Payment Reminder'}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(toast.dueDate || toast.timestamp)}</div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 8 }}>{toast.body || toast.message}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { removeNotification(toast.id); setShowToast(false); }} style={{ border: 'none', background: '#ef4444', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Dismiss</button>
                <button onClick={() => { setShowToast(false); navigate('/payment-reminder', { state: { notification: toast } }); }} style={{ border: 'none', background: '#2563eb', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Open</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
