# Godinez Resort Website

A full front-end + backend website for Godinez Resort in Bacolod, Negros Occidental, with online booking/reservation
requests for villas, tours, and activities, plus a login-protected admin dashboard for editing content and a staff
view for managing bookings.

## What's included

- **Front-end** (`public/`): plain HTML/CSS/JS - no build step, no framework. Open and edit directly.
- **Backend** (`server/`): Node.js + Express API that serves the site's content, handles bookings, and runs the
  login/admin system.
- **Public sections**: Home, Villas, Pools, In-house Restaurant (G-Resto), Activities, Travel & Tours, Contact.
- **Booking**: every "Book Now" style button opens a form; submissions are saved and viewable/manageable at
  `/admin.html` once logged in.
- **Admin dashboard** (`/admin-dashboard.html`): edit villa/pool/restaurant/activity/tour text, upload/replace
  photos, pick a color theme, and manage staff accounts. Admin login required.
- **Staff bookings view** (`/admin.html`): view, filter, and update the status of booking requests. Any logged-in
  account (admin or staff) can use this.

## Running it locally

Requires [Node.js](https://nodejs.org) (v18 or newer).

```
cd godinez-resort
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

### First-time setup

The very first time you visit **http://localhost:3000/admin.html** (or `/admin-dashboard.html`), you'll be sent to
a one-time "Create the Admin Account" form instead of a normal login - there are no built-in default
username/password, on purpose. Create your admin account there and keep those credentials somewhere safe. From
then on, that page shows a normal login form, and you can create additional staff accounts from the admin
dashboard's "Staff Accounts" tab.

## Editing the front-end

Everything is in `public/`:

- `public/index.html` - page structure and sections.
- `public/css/style.css` - colors, fonts, layout. Base colors are CSS variables (`--color-forest`, `--color-gold`,
  etc.) - the admin dashboard's "Color Theme" tab overrides these with a few preset combinations, so you don't
  need to edit CSS by hand to reskin the site.
- `public/js/main.js` - fetches data from the API and renders the villa/pool/activity/tour cards, the photo
  lightbox, and the booking modal.
- `public/js/admin.js` / `public/js/admin-login.js` / `public/js/admin-dashboard.js` - the staff/admin pages.

No build tools, no compiling - front-end edits just need a browser refresh.

## Editing content without the admin dashboard

You can still hand-edit the JSON files directly if you'd rather do that than use the dashboard:

- `server/data/content/*.json` - villas, pools, restaurant menu, activities, tour spots, and the current color
  theme. Edit these to add, remove, or change any listing - no code changes needed. Changes here show up on a
  browser refresh, with no server restart required.
- `server/data/store/bookings.json` - the actual saved booking requests.
- `server/data/store/users.json` - admin/staff accounts (passwords are bcrypt-hashed, never stored in plain text -
  don't hand-edit this one).
- `server/data/images/` - real photos live here. Drop a file in and set the matching item's `"photoUrl"` field in
  the content JSON to `"images/your-file.jpg"` (the admin dashboard's photo upload does this for you
  automatically).

**Why `server/data/` and not `server/content/` / `server/store/` / `public/images/`?** Everything the site can
change at runtime (content, bookings, accounts, uploaded photos) now lives under this one folder. That's what
makes the Render deployment in `DEPLOYMENT.md` simple: attach one persistent disk, mount it at `server/data/`, and
every admin edit and photo upload survives restarts and redeploys.

## Code layout

- `server/routes/content.js` - read-only public API endpoints for the content above.
- `server/routes/admin.js` - the admin-only content-editing, photo-upload, and theme endpoints.
- `server/routes/auth.js` - login, first-run setup, logout, password change, and staff account management.
- `server/routes/bookings.js` - new booking submissions, the staff booking list, and status updates.
- `server/middleware/auth.js` - `requireAuth` / `requireAdmin` route guards.
- `server/lib/users.js` - the account store (bcrypt password hashing).
- `server/lib/sessionRegistry.js` - lets deleting a staff account immediately end any session it currently has open.
- `server/lib/contentStore.js` - reads/writes the content JSON fresh from disk (no restart needed to see edits).
- `server/lib/db.js` - tiny JSON-file database for bookings (uses the `lowdb` package, no database server to install).
- `server/lib/validate.js` - server-side validation for booking submissions.
- `server/index.js` - the Express server entry point (security headers, sessions, route wiring).

## Going live

See **`DEPLOYMENT.md`** for a full step-by-step walkthrough of putting this on the public internet (hosting,
environment variables, persistent storage, custom domain).

## Security

See **`SECURITY-REVIEW.md`** for a full write-up of what's been checked and fixed. Short version: login/sessions,
role-based access (admin vs staff), rate-limited login and booking forms, validated + magic-byte-checked photo
uploads, and output encoding that prevents admin-entered text from ever being treated as HTML/script.

Two things that live outside the app's code, worth double-checking before (and after) you go live:

- Set a real `SESSION_SECRET` environment variable (see `.env.example`) - without one, restarting the server logs
  everyone out, and a guessable secret would let sessions be forged.
- Set `NODE_ENV=production` once deployed - this switches login cookies to HTTPS-only mode.

## Project structure

```
godinez-resort/
├── package.json
├── .env.example
├── DEPLOYMENT.md
├── SECURITY-REVIEW.md
├── server/
│   ├── index.js              # Express app entry point
│   ├── data/                  # ALL mutable data - mount your persistent disk here (see DEPLOYMENT.md)
│   │   ├── content/            # Editable site copy (villas, pools, activities, tours, restaurant, theme)
│   │   ├── store/               # bookings.json + users.json
│   │   └── images/              # Uploaded/real photos
│   ├── routes/                 # API route handlers (content, admin, auth, bookings)
│   ├── middleware/auth.js      # requireAuth / requireAdmin
│   └── lib/                    # Validation, user store, session registry, content store, JSON database
└── public/
    ├── index.html
    ├── admin.html               # Staff bookings view (login required)
    ├── admin-login.html         # Login / first-run admin setup
    ├── admin-dashboard.html     # Admin content editor (login required, admin role)
    ├── css/style.css
    └── js/                      # main.js, admin.js, admin-login.js, admin-dashboard.js
```
