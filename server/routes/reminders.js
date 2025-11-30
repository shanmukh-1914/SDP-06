const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// Create reminder
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    const r = new Reminder({
      userEmail: data.userEmail,
      type: data.type,
      title: data.title,
      body: data.body,
      amount: data.amount,
      dueDate: data.dueDate,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      recurring: data.recurring,
      status: data.scheduledAt ? 'scheduled' : 'active'
    });
    const saved = await r.save();
    res.json({ ok: true, reminder: saved });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// List reminders (optionally filter by userEmail)
router.get('/', async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const q = userEmail ? { userEmail } : {};
    const items = await Reminder.find(q).sort({ createdAt: -1 }).limit(500);
    res.json({ ok: true, reminders: items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Update a reminder
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const changes = req.body || {};
    if (changes.scheduledAt) changes.scheduledAt = new Date(changes.scheduledAt);
    const updated = await Reminder.findByIdAndUpdate(id, changes, { new: true });
    res.json({ ok: true, reminder: updated });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Reminder.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
