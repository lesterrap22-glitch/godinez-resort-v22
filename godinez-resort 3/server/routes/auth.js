// Login/setup/user-management endpoints for the admin & staff dashboards.
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const users = require('../lib/users');
const sessionRegistry = require('../lib/sessionRegistry');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Slow down password-guessing: 10 attempts per 15 minutes per IP, shared
// across both the one-time setup and the regular login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' },
});

function publicUser(u) {
  return { id: u.id, username: u.username, displayName: u.displayName, role: u.role };
}

// Is an admin account needed yet? The front-end uses this to decide whether
// to show the "create the admin account" form or the normal login form.
router.get('/setup-status', (req, res) => {
  res.json({ needsSetup: !users.hasAnyUsers() });
});

// One-time: create the first (admin) account. Locks itself out forever once
// any account exists, so this can never be used to slip in a second admin.
router.post('/setup', loginLimiter, (req, res) => {
  if (users.hasAnyUsers()) {
    return res.status(403).json({ ok: false, errors: ['Setup has already been completed.'] });
  }
  const { username, password, displayName } = req.body || {};
  const errors = users.validateNewUserInput({ username, password, displayName });
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const user = users.createFirstAdmin({ username, password, displayName });
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ ok: false, errors: ['Could not start session.'] });
    req.session.userId = user.id;
    sessionRegistry.track(user.id, req.sessionID);
    res.status(201).json({ ok: true, user: publicUser(user) });
  });
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const user = users.findByUsername(username);
  // Same generic error either way - don't reveal whether the username exists.
  if (!user || !users.verifyPassword(user, password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect username or password.' });
  }
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ ok: false, error: 'Could not start session.' });
    req.session.userId = user.id;
    sessionRegistry.track(user.id, req.sessionID);
    res.json({ ok: true, user: publicUser(user) });
  });
});

router.post('/logout', (req, res) => {
  if (req.session && req.session.userId) {
    sessionRegistry.untrack(req.session.userId, req.sessionID);
  }
  req.session.destroy(() => {
    res.clearCookie('godinez.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

// Self-service password change for whoever is logged in.
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!users.verifyPassword(req.user, currentPassword)) {
    return res.status(401).json({ ok: false, errors: ['Current password is incorrect.'] });
  }
  if (!newPassword || String(newPassword).length < 10) {
    return res.status(400).json({ ok: false, errors: ['New password must be at least 10 characters.'] });
  }
  users.setPassword(req.user.id, newPassword);
  res.json({ ok: true });
});

// --- Admin-only staff management ---

router.get('/users', requireAdmin, (req, res) => {
  res.json({ ok: true, users: users.listStaff() });
});

router.post('/users', requireAdmin, (req, res) => {
  const { username, password, displayName, role } = req.body || {};
  const errors = users.validateNewUserInput({ username, password, displayName });
  if (role !== 'admin' && role !== 'staff') errors.push('Role must be "admin" or "staff".');
  if (users.findByUsername(username)) errors.push('That username is already taken.');
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const user = users.createUser({ username, password, displayName, role });
  res.status(201).json({ ok: true, user: publicUser(user) });
});

router.delete('/users/:id', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ ok: false, error: "You can't remove your own account while logged in as it." });
  }
  const removed = users.deleteUser(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: 'User not found.' });
  // Immediately end any session that account currently has open, rather than
  // letting it keep working until its cookie happens to expire.
  sessionRegistry.destroyAllForUser(req.sessionStore, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
