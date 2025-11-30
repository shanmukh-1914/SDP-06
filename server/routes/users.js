const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create user (register)
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.email) return res.status(400).json({ ok: false, error: 'Missing email' });
    // save basic user record; passwordHash expected pre-hashed by client
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) return res.status(409).json({ ok: false, error: 'Email already registered' });
    const u = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      isAdmin: !!data.isAdmin
    });
    const saved = await u.save();
    res.json({ ok: true, user: { id: saved._id, firstName: saved.firstName, lastName: saved.lastName, email: saved.email, isAdmin: saved.isAdmin } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// simple login (verify email + passwordHash)
router.post('/login', async (req, res) => {
  try {
    const { email, passwordHash } = req.body || {};
    if (!email || !passwordHash) return res.status(400).json({ ok: false, error: 'Missing credentials' });
    const user = await User.findOne({ email: email.toLowerCase(), passwordHash });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    res.json({ ok: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// list users (admin use)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).limit(200);
    res.json({ ok: true, users });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
