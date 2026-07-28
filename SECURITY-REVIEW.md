# Security check — Godinez Resort website

**Date:** 2026-07-28  ·  **Reviewed by:** Secure Vibe-Code  ·  **Baseline:** AppSec Minimum Level (1)

## What this tool is

A small Node.js/Express website for a resort: a public front-end (villas, pools, restaurant, activities, tours,
booking forms), plus a login-protected admin dashboard (edit text/photos/color theme, manage staff accounts) and a
staff bookings view. Data is stored in local JSON files (no external database). It's about to be deployed
publicly on the open internet and will handle real personal data from guests (name, email, phone, notes) and
staff/admin login credentials. Because of that, this review treats it at full seriousness, not as a throwaway
sandbox script.

## Bottom line

Solid overall - session handling, authorization, and file-upload safety were mostly done right from the start.
This pass found and fixed one real issue (site content was rendered in a way that would have allowed script
injection once admins could edit it), tightened CORS and HSTS, and closed a gap where a removed staff account
could keep using an already-open session.

| | Count |
|---|---|
| ✅ Met | 34 |
| ⚠️ Partial | 1 |
| ❌ Not met (fixed) | 3 |
| ❓ Can't tell | 0 |
| ➖ Not applicable | 14 |

## Top things to fix (plain language)

1. **Stored script injection (fixed)** — Villa/pool/restaurant/activity/tour text was being inserted into the page
   with `innerHTML`. Once that text became editable through the admin dashboard, anyone who got hold of an admin
   login (e.g. a phished password) could have planted a script that ran in every visitor's browser. Fixed by
   switching all rendering to `textContent`, which can never be interpreted as HTML/script. (req 1.2.1, 3.2.2)
2. **Wide-open CORS (fixed)** — The site allowed *any* other website's JavaScript to call its API. Not needed here
   (the front-end only ever calls itself) and removed entirely. (req 3.4.2)
3. **Removed staff accounts stayed logged in (fixed)** — Deleting a staff account didn't end their current
   session; they could keep using the site until their cookie expired on its own (up to 8 hours). Added
   immediate session termination on account removal. (req 7.4.2)

> Before/while going live, also revisit: HTTPS enforcement and secure cookies only take effect once `NODE_ENV=production`
> is actually set on the host (see DEPLOYMENT.md) - this is called out below as a deploy-time action item, not a
> code gap.

## Detailed findings

### 1 — Encoding and Neutralization

| Req | What it means (plain) | Verdict | Notes |
|---|---|---|---|
| 1.2.1 | HTML output is encoded for its context | ✅ Met (fixed) | Switched `el()` in `main.js`/`admin-dashboard.js` from `innerHTML` to `textContent`; rebuilt the one spot using a `<strong>` tag via real DOM elements instead of string concatenation. |
| 1.2.2 | URLs built from untrusted data are encoded, only safe protocols | ✅ Met | Photo URLs are either server-generated (upload endpoint) or fixed external URLs in the content files - never built from raw user text. |
| 1.2.3 | JSON output is properly encoded | ✅ Met | All API responses use Express's `res.json()`, which encodes correctly. |
| 1.2.4 | Parameterized queries/ORM | ➖ N/A | No SQL database - content and bookings are stored as JSON files, no query language involved. |
| 1.2.5 | Safe OS command calls | ➖ N/A | The app never shells out (no `exec`/`spawn`/`child_process`). |
| 1.3.1 | HTML from users is sanitized before rendering | ➖ N/A | The app never accepts or renders user-supplied HTML - all text fields are treated strictly as plain text. |
| 1.3.2 | No `eval()`/dynamic code execution | ✅ Met | Confirmed no `eval` anywhere in the codebase. |
| 1.4.1 | XXE prevention | ➖ N/A | No XML parsing anywhere. |

### 2 — Validation and Business Logic

| Req | What it means | Verdict | Notes |
|---|---|---|---|
| 2.1.1 | Validation rules are documented | ✅ Met | `server/lib/validate.js` and the admin route field whitelists define exactly what's accepted (formats, lengths, ranges). |
| 2.2.1 | Input checked against expected format/range | ✅ Met | Email/phone/date regexes, guest-count range, username pattern, password length, theme ID allowlist, role allowlist, number ranges for capacity/bedrooms. |
| 2.2.2 | Validation happens on the backend | ✅ Met | Every check above is re-verified server-side, never trusting the browser form alone. |
| 2.3.1 | Multi-step flows can't be skipped/reordered | ✅ Met | The one-time admin "setup" step locks itself out permanently once any account exists, so it can't be replayed. |

### 3 — Web Interface Security

| Req | What it means | Verdict | Notes |
|---|---|---|---|
| 3.2.1/3.2.2 | Responses can't be mis-rendered; safe text rendering | ✅ Met (fixed) | Content-Security-Policy set via Helmet; rendering fixed per 1.2.1 above. |
| 3.3.1 | Cookies marked `Secure` | ⚠️ Partial | Cookie is `Secure` only when `NODE_ENV=production` (correct - `Secure` cookies are dropped by browsers over plain HTTP, which is expected on localhost). **Action needed at deploy time:** set `NODE_ENV=production` on your host, covered in DEPLOYMENT.md. |
| 3.4.1 | HSTS header, 1 year minimum | ✅ Met (fixed) | Helmet's default is 180 days; explicitly set to a full year. |
| 3.4.2 | CORS origin is fixed/allowlisted, not wildcard | ✅ Met (fixed) | Removed the `cors` middleware entirely - the app doesn't need cross-origin access, so none is granted. |
| 3.5.1/3.5.3/3.5.6 | CSRF protection; safe HTTP methods; no JSONP | ✅ Met | Session cookie uses `SameSite=Lax` (not sent on cross-site POST/PUT/PATCH/DELETE); all state-changing routes require `Content-Type: application/json`, which forces a CORS preflight that the tightened CORS policy above will reject cross-site; all state changes use POST/PUT/PATCH/DELETE, never GET; JSONP isn't used anywhere. |
| 3.7.1 | Only supported, secure web tech | ✅ Met | Plain HTML/CSS/vanilla JS and Express - nothing deprecated. |

### 4 — API / WebSocket

| Req | Verdict | Notes |
|---|---|---|
| 4.4.1 | ➖ N/A | No WebSockets used. |

### 5 — File Handling

| Req | What it means | Verdict | Notes |
|---|---|---|
| 5.2.1 | Only processable files accepted (size limits) | ✅ Met | 8MB per-file cap via multer. |
| 5.2.2 | Extension + actual content (magic bytes) checked | ✅ Met | Uploaded photos are checked against real JPEG/PNG/WEBP magic-byte signatures; the client's claimed filename/extension is never trusted - the server picks the extension based on what it actually detected. |
| 5.3.1 | Uploaded files can't run as server code | ✅ Met | Files are only ever served as static assets from `public/images/`; nothing executes uploaded content. |
| 5.3.2 | File paths built from trusted data | ✅ Met | Filenames are built from the server's own random bytes plus an item ID that must already exist in the content files (an unmatched/forged ID 404s before any file is written) - never from raw client input. |

### 7 — Session Management

| Req | What it means | Verdict | Notes |
|---|---|---|
| 7.2.1 | Session checks happen server-side | ✅ Met | `requireAuth`/`requireAdmin` validate `req.session.userId` against the real user store on every request. |
| 7.2.2 | Sessions are dynamic, not a static shared secret | ✅ Met | Standard `express-session` per-login session IDs. |
| 7.2.3 | Session IDs are CSPRNG, ≥128 bits | ✅ Met | `express-session` default ID generation (192-bit random). |
| 7.2.4 | New session issued on login | ✅ Met | `req.session.regenerate()` is called before establishing a logged-in session, on both setup and login. |
| 7.4.1 | Logout/expiry makes the session unusable | ✅ Met | Logout calls `session.destroy()` and clears the cookie. |
| 7.4.2 | Deleting/disabling a user kills their active sessions immediately | ✅ Met (fixed) | Added `server/lib/sessionRegistry.js` to track sessions per user and force-destroy them the moment an admin removes that account, instead of waiting for the cookie to expire on its own. |

*Note:* sessions are held in server memory (`express-session`'s default `MemoryStore`). That's appropriate for a
single small instance like this one, but isn't meant to scale across multiple server instances - worth knowing if
the site ever needs to run on more than one instance at once.

### 8 — Authorization

| Req | What it means | Verdict | Notes |
|---|---|---|
| 8.1.1/8.1.2 | Access is role-based, checked explicitly | ✅ Met | `admin` vs `staff` role stored server-side; content/user-management routes require `admin`, bookings routes require any logged-in role. |
| 8.2.1 | Authorization enforced server-side, not client-controlled | ✅ Met | All checks happen in Express middleware before any handler runs; the front-end's own role checks are cosmetic only. |

### 9 — JWT

| Req | Verdict | Notes |
|---|---|---|
| 9.1.x / 9.2.1 | ➖ N/A | No JWTs or self-contained tokens are used - sessions are server-side only. |

### 11 — Cryptography

| Req | What it means | Verdict | Notes |
|---|---|---|
| 11.2.1 | Strong ciphers if encryption is used | ➖ N/A | The app doesn't encrypt any data. |
| 11.3.1 | Strong hash functions | ✅ Met | Passwords hashed with bcrypt (cost factor 12) - never MD5/SHA1/plaintext. |

### 12 — Transport Layer Security

| Req | Verdict | Notes |
|---|---|---|
| 12.1.1 | ➖ N/A (platform-level) | TLS version is enforced by whatever host you deploy to (e.g. Render terminates TLS 1.2/1.3 automatically) - not something the app code controls. |
| 12.2.1/12.2.2 | ➖ N/A | The server makes no outbound HTTP calls to any external service. |

### 13 — Configuration

| Req | Verdict | Notes |
|---|---|---|
| 13.4.1 | ✅ Met | No `.git`/`.svn` folder exists in the project. |

### 14 — Data Protection

| Req | What it means | Verdict | Notes |
|---|---|---|
| 14.2.1 | Confidential data sent in body/headers, not URL | ✅ Met | Login credentials and booking details are always sent as POST/PUT/PATCH JSON bodies, never in a query string. |
| 14.3.1 | Auth data cleared from client storage on logout | ✅ Met | No auth data is ever stored in `localStorage`/`sessionStorage` - the session lives only in an `httpOnly` cookie (inaccessible to page JavaScript), which is cleared server-side on logout. |

### 15 — Secure Architecture and Development

| Req | What it means | Verdict | Notes |
|---|---|---|
| 15.1.1 | No outdated/vulnerable dependencies | ✅ Met | `npm audit --production` reports 0 known vulnerabilities. Recheck this periodically as dependencies age. |
| 15.2.1 | Only necessary fields returned | ✅ Met | User-related endpoints always return a filtered `{id, username, displayName, role}` shape - the password hash is never sent to the browser under any endpoint. |

### 18 — Containerization

| Req | Verdict | Notes |
|---|---|---|
| 18.x | ➖ N/A | The app isn't containerized (no Dockerfile). |

## Fixes applied

- ✅ 1.2.1 / 3.2.2 — Changed `el()` in `public/js/main.js` and `public/js/admin-dashboard.js` to use `textContent` instead of `innerHTML`; rebuilt the restaurant-highlights `<strong>` markup with real DOM elements instead of a template-literal string.
- ✅ (data correctness, related to the above) — Removed HTML-escaping from `server/lib/validate.js`'s `sanitize()` at write time, since escaping there *and* rendering via `textContent` would have double-encoded characters like apostrophes into visible `&#39;` text. The one safe place to encode is at render time, which is now handled everywhere.
- ✅ 3.4.1 — Set Helmet's HSTS `maxAge` to 31536000 (1 year) instead of the library default of 180 days.
- ✅ 3.4.2 — Removed the `cors` package/middleware entirely; the app only ever needs same-origin requests.
- ✅ 7.4.2 — Added `server/lib/sessionRegistry.js` and wired it into login/logout/account-deletion so removing a staff account immediately ends any session it currently has open.

## Notes

- This review assumes the app will be deployed with `NODE_ENV=production` and served over HTTPS (both covered in
  DEPLOYMENT.md) - a few items (`Secure` cookies, HSTS taking effect) only fully apply once that's true.
- `express-session`'s in-memory session store is fine for a single small server instance, which is what
  DEPLOYMENT.md sets up. If the site later grows enough to need multiple server instances running at once, that
  session store would need to move to a shared store (e.g. Redis) - flagging this now so it isn't a surprise
  later, not because it's a problem today.
- No database is used, so several requirements around SQL/NoSQL injection don't apply; if a real database is
  added later, those checks should be revisited.
