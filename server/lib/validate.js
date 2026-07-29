// Server-side validation for booking submissions.
// We never trust the browser: every field here is re-checked on the server,
// even though the front-end form also validates before submitting.

const ALLOWED_TYPES = ['villa', 'tour', 'activity', 'restaurant', 'event'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Basic phone check: digits, spaces, +, -, ( ) only, 7-20 chars long.
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/;
// Expect an HTML date input value: YYYY-MM-DD.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(value, maxLen = 200) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLen;
}

// Trims and normalizes untrusted text before it's stored. This deliberately
// does NOT HTML-escape (e.g. turn " into &quot;) - the actual defense
// against stored XSS is that every place this data is later displayed
// (public/js/main.js, admin.js, admin-dashboard.js) renders it with
// textContent, never innerHTML, so it can never be interpreted as markup
// no matter what characters it contains. HTML-escaping here as well would
// just corrupt the stored text (a guest named "O'Brien" would end up stored,
// and then displayed, as the literal text "O&#39;Brien").
function sanitize(value) {
  return String(value).trim();
}

function validateBooking(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const { type, itemId, itemName, name, email, phone, date, guests, notes } = body;

  if (!ALLOWED_TYPES.includes(type)) {
    errors.push(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
  }
  if (!isNonEmptyString(itemId, 100)) errors.push('itemId is required.');
  if (!isNonEmptyString(itemName, 150)) errors.push('itemName is required.');
  if (!isNonEmptyString(name, 150)) errors.push('name is required.');
  if (!isNonEmptyString(email, 200) || !EMAIL_RE.test(email)) errors.push('A valid email is required.');
  if (!isNonEmptyString(phone, 30) || !PHONE_RE.test(phone)) errors.push('A valid phone number is required.');
  if (!isNonEmptyString(date, 10) || !DATE_RE.test(date)) errors.push('date must be in YYYY-MM-DD format.');

  const guestsNum = Number(guests);
  if (!Number.isInteger(guestsNum) || guestsNum < 1 || guestsNum > 50) {
    errors.push('guests must be a whole number between 1 and 50.');
  }

  if (notes !== undefined && notes !== null && !isNonEmptyString(notes, 1000) && notes !== '') {
    errors.push('notes must be 1000 characters or fewer.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateBooking, sanitize, ALLOWED_TYPES };
