import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'mf_reminder_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { autoCreate: true, daysBefore: 3, recurrence: 'monthly' };
    return { ...JSON.parse(raw) };
  } catch (e) {
    return { autoCreate: true, daysBefore: 3, recurrence: 'monthly' };
  }
}

export default function ReminderSettings() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSaved(false); }, [settings]);

  function handleToggle(e) {
    setSettings(prev => ({ ...prev, autoCreate: e.target.checked }));
  }

  function handleDays(e) {
    setSettings(prev => ({ ...prev, daysBefore: parseInt(e.target.value || '0', 10) }));
  }

  function handleSave(e) {
    e.preventDefault();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); setSaved(true); } catch (err) { console.error(err); }
  }

  return (
    <div className="container" style={{ padding: 20 }}>
      <h2>Reminder Settings</h2>
      <form onSubmit={handleSave} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <input id="autoCreate" type="checkbox" checked={!!settings.autoCreate} onChange={handleToggle} />
          <label htmlFor="autoCreate">Automatically create payment reminders when adding investments</label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Days before due date to alert (lead time)</label>
          <input type="number" min="0" value={settings.daysBefore || 0} onChange={handleDays} style={{ display: 'block', marginTop: 6 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Recurrence for reminders</label>
          <select value={settings.recurrence || 'none'} onChange={e=>setSettings(prev=>({...prev, recurrence: e.target.value}))} style={{ display: 'block', marginTop: 6 }}>
            <option value="none">None</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn-primary">Save</button>
          {saved && <span style={{ color: '#16a34a', alignSelf: 'center' }}>Saved</span>}
        </div>
      </form>
    </div>
  );
}
