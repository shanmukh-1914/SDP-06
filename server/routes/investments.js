const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');

// Create investment
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    const inv = new Investment({
      userEmail: data.userEmail,
      name: data.name,
      amount: data.amount,
      date: data.date
    });
    const saved = await inv.save();
    res.json({ ok: true, investment: saved });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// List investments (optionally filter by userEmail)
router.get('/', async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const q = userEmail ? { userEmail } : {};
    const items = await Investment.find(q).sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, investments: items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
