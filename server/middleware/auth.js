// Session-based auth guards used by the admin/staff API routes.
// req.session.userId is set on successful login (see routes/auth.js).
const users = require('../lib/users');

// Any logged-in account (admin or staff) - used for the bookings
// view/manage endpoints.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: 'Not logged in.' });
  }
  const user = users.findById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ ok: false, error: 'Session expired.' });
  }
  req.user = user;
  next();
}

// Admin-only - used for content/photo/theme/user-management endpoints.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
