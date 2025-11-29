import React, { useMemo, useState } from 'react';
import useNotifications from '../hooks/useNotifications';

function formatDateInput(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,16);
  } catch (e) { return ''; }
}

export default function ScheduledReminders() {
  const { notifications, removeNotification, updateNotification, addNotification } = useNotifications();
  const scheduled = useMemo(() => notifications.filter(n => n.status === 'scheduled'), [notifications]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', amount: '', scheduledAt: '', recurring: 'none' });

  function handleCreateChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function createReminder(e) {
    e.preventDefault();
    const payload = {
      type: 'payment_reminder',
      title: form.title || 'Reminder',
      body: form.body || '',
      amount: form.amount ? parseFloat(form.amount) : undefined,
    };
    if (form.scheduledAt) {
      try { payload.scheduledAt = new Date(form.scheduledAt).toISOString(); } catch (e) {}
    }
    if (form.recurring && form.recurring !== 'none') payload.recurring = form.recurring;
    addNotification(payload);
    setForm({ title: '', body: '', amount: '', scheduledAt: '', recurring: 'none' });
    setCreating(false);
  }

  function startEdit(n) {
    setEditing({ ...n });
  }

  function cancelEdit() { setEditing(null); }

  function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    const changes = {
      scheduledAt: editing.scheduledAt,
      recurring: editing.recurring || null,
      title: editing.title,
      body: editing.body,
    };
    updateNotification(editing.id, changes);
    setEditing(null);
  }

  return (
    <div className="container" style={{ padding: 20 }}>
      <h2>Scheduled Reminders</h2>
      <div style={{ marginBottom: 12 }}>
        <button className="btn-primary" onClick={() => setCreating(c => !c)}>{creating ? 'Cancel' : 'Create Manual Reminder'}</button>
      </div>

      {creating && (
        <form onSubmit={createReminder} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input name="title" placeholder="Title" value={form.title} onChange={handleCreateChange} />
            <textarea name="body" placeholder="Description" value={form.body} onChange={handleCreateChange} />
            <input name="amount" placeholder="Amount (optional)" value={form.amount} onChange={handleCreateChange} />
            <label>Scheduled at</label>
            <input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handleCreateChange} />
            <label>Recurrence</label>
            <select name="recurring" value={form.recurring} onChange={handleCreateChange}>
              <option value="none">None</option>
              <option value="monthly">Monthly</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}
      {scheduled.length === 0 ? (
        <div>No scheduled reminders.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {scheduled.map(s => (
            <li key={s.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{s.body}</div>
                  <div style={{ marginTop: 6 }}>Scheduled at: {s.scheduledAt}</div>
                  <div>Recurrence: {s.recurring || 'none'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn-secondary" onClick={() => removeNotification(s.id)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div style={{ marginTop: 12, maxWidth: 720 }}>
          <h3>Edit Scheduled Reminder</h3>
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={editing.title || ''} onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} />
            <textarea value={editing.body || ''} onChange={e => setEditing(prev => ({ ...prev, body: e.target.value }))} />
            <label>Scheduled at</label>
            <input type="datetime-local" value={formatDateInput(editing.scheduledAt)} onChange={e => {
              const v = e.target.value; // local datetime
              // convert to ISO
              const iso = new Date(v).toISOString();
              setEditing(prev => ({ ...prev, scheduledAt: iso }));
            }} />
            <label>Recurrence</label>
            <select value={editing.recurring || 'none'} onChange={e => setEditing(prev => ({ ...prev, recurring: e.target.value }))}>
              <option value="none">None</option>
              <option value="monthly">Monthly</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
