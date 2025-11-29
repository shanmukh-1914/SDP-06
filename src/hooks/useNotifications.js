import { useEffect, useRef, useState, useCallback } from 'react';

// Notifications hook with support for scheduled and recurring reminders.
// - Stores notifications in localStorage (key `mf_notifications`).
// - Supports entries with `status: 'scheduled'` and `scheduledAt` (ISO string).
// - Scheduler activates scheduled entries when due; recurring monthly entries are re-scheduled.

export default function useNotifications(opts = {}) {
  const {
    url = window.__MF_NOTIFICATIONS_WS || localStorage.getItem('mf_notifications_ws') || null,
    reconnectInterval = 5000,
    persist = true,
    storageKey = 'mf_notifications',
  } = opts;

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const [connected, setConnected] = useState(false);

  const loadInitial = () => {
    if (!persist) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
    return [];
  };

  const [notifications, setNotifications] = useState(loadInitial);

  // persist notifications
  useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem(storageKey, JSON.stringify(notifications)); } catch (e) {}
  }, [notifications, persist, storageKey]);

  // Scheduler: activate scheduled notifications when due and handle recurring monthly ones
  useEffect(() => {
    if (!persist) return undefined;
    let mounted = true;
    const tick = () => {
      try {
        setNotifications((prev) => {
          const now = Date.now();
          let changed = false;
          const next = prev.slice();
          for (let i = 0; i < next.length; i++) {
            const it = next[i];
            if (it && it.status === 'scheduled' && it.scheduledAt) {
              const scheduledMs = new Date(it.scheduledAt).getTime();
              if (!isNaN(scheduledMs) && scheduledMs <= now) {
                // activate this entry
                const active = { ...it, status: 'active', activatedAt: new Date().toISOString() };
                next[i] = active;
                changed = true;
                // if recurring monthly, schedule next occurrence
                if (it.recurring === 'monthly') {
                  const base = new Date(it.scheduledAt);
                  const nextMonth = new Date(base);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  const scheduledCopy = { ...it, id: Date.now() + Math.random(), scheduledAt: nextMonth.toISOString(), status: 'scheduled' };
                  next.push(scheduledCopy);
                }
              }
            }
          }
          if (changed) return next;
          return prev;
        });
      } catch (e) {
        // ignore
      }
    };

    tick();
    const iv = setInterval(tick, 30_000);
    return () => { clearInterval(iv); mounted = false; };
  }, [persist, storageKey]);

  const addNotification = useCallback((payload) => {
    const base = { id: Date.now() + Math.random(), read: false, timestamp: new Date().toISOString(), ...payload };
    // If scheduledAt provided and it's in the future, mark as scheduled
    if (base.scheduledAt) {
      try {
        const ms = new Date(base.scheduledAt).getTime();
        if (!isNaN(ms) && ms > Date.now()) {
          const entry = { ...base, status: 'scheduled', scheduledAt: new Date(base.scheduledAt).toISOString() };
          setNotifications((prev) => [entry, ...prev]);
          return entry;
        }
      } catch (e) {}
    }
    const entry = { ...base, status: 'active' };
    setNotifications((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const updateNotification = useCallback((id, changes) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, ...changes } : n));
  }, []);

  // websocket connection (optional)
  useEffect(() => {
    if (!url) return undefined;

    function connect() {
      try { wsRef.current = new WebSocket(url); } catch (err) { scheduleReconnect(); return; }

      wsRef.current.addEventListener('open', () => {
        setConnected(true);
        if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
      });

      wsRef.current.addEventListener('message', (ev) => {
        let data = null;
        try { data = JSON.parse(ev.data); } catch (e) { data = { message: String(ev.data) }; }
        addNotification(data);
      });

      wsRef.current.addEventListener('close', () => { setConnected(false); scheduleReconnect(); });
      wsRef.current.addEventListener('error', () => { if (wsRef.current) wsRef.current.close(); });
    }

    function scheduleReconnect() {
      if (reconnectTimer.current) return;
      reconnectTimer.current = setTimeout(() => { reconnectTimer.current = null; connect(); }, reconnectInterval);
    }

    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { try { wsRef.current.close(); } catch (e) {} wsRef.current = null; }
    };
  }, [url, reconnectInterval, addNotification]);

  return {
    connected,
    notifications,
    addNotification,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    updateNotification,
  };
}
