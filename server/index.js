// Godinez Resort website server.
// Serves the front-end (public/) and a small JSON API (/api/...) that powers
// the site's content, the booking/reservation forms, and the admin/staff
// login + dashboard.
require('dotenv').config({ quiet: true });
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');

const contentRoutes = require('./routes/content');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Render/Railway/etc. put the app behind a reverse proxy. Without this,
// Express can't tell the connection is actually HTTPS, which would break
// secure cookies and rate-limiter IP detection.
app.set('trust proxy', 1);

// helmet() sets a set of safe-by-default security headers (e.g. blocks the
// site from being framed by other sites, disables MIME sniffing). We relax
// the default Content-Security-Policy slightly so our own inline <script>
// in public/ can still run, and so the Travel & Tours photos (hotlinked from
// Wikimedia Commons) are allowed to load - the default policy only allows
// same-origin images, which would otherwise silently block those photos.
// hsts is bumped to a full year (the default is 180 days) per baseline
// AppSec requirement 3.4.1 - harmless to send over plain HTTP too, browsers
// simply ignore it until the site is actually served over HTTPS.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);
// No cross-origin API consumers exist or are needed - the front-end is
// served from this same app and only ever calls itself. Deliberately NOT
// using the `cors` package here: its default settings reflect back
// whichever Access-Control-Allow-Origin the caller sends, which would let
// any other website's JavaScript read from these (cookie-authenticated)
// endpoints in a browser. With no CORS headers at all, only same-origin
// requests are allowed - which is all this app ever needs.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

if (!process.env.SESSION_SECRET) {
  // Fine for local testing, but every restart would log everyone out and -
  // more importantly - a guessable secret makes sessions forgeable. Always
  // set a real SESSION_SECRET before deploying publicly (see DEPLOYMENT.md).
  console.warn(
    '[warning] SESSION_SECRET is not set - using a random one-time value. ' +
      'Set SESSION_SECRET in your environment before deploying this publicly.'
  );
}
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.use(
  session({
    name: 'godinez.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd, // requires HTTPS - true once deployed behind Render's TLS
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);
app.use('/api', contentRoutes);
app.use('/api/bookings', bookingRoutes);

// Photos live under server/data/images/ (not public/images/) so that, once
// deployed, mounting a single persistent disk at server/data/ is enough to
// keep every admin-uploaded photo across restarts/redeploys - see
// DEPLOYMENT.md. This still serves them at the same public URL path
// (/images/whatever.jpg) that server/content/*.json's photoUrl fields use.
app.use('/images', express.static(path.join(__dirname, 'data', 'images')));
// The front-end is now a React (Vite) app built to client/dist/ (run `npm
// run build`, or `npm --prefix client run dev` for a live-reloading copy
// while working on it) - this replaced the old vanilla HTML/JS in public/.
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Multer (file upload) errors land here instead of crashing the request -
// e.g. a photo over the 8MB limit - so the admin dashboard gets a clean
// JSON error back instead of a raw stack trace.
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ ok: false, error: `Upload error: ${err.message}` });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Something went wrong on the server.' });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Godinez Resort site running at http://localhost:${PORT}`);
});
