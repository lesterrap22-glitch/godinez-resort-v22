// Booking/reservation endpoints. Guests submit a request from the site's
// "Book Now" buttons; logged-in staff/admin review submissions on
// /admin.html (see routes/auth.js for the login system).
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../lib/db');
const { validateBooking, sanitize } = require('../lib/validate');
const { requireAuth } = require('../middleware/auth');

// Guests can only submit so many booking requests per IP per hour - this is
// a public form with no login, so it's the main spot to guard against spam
// or someone hammering the endpoint.
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, errors: ['Too many booking requests from this connection. Please try again later.'] },
});

const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled'];

// Create a new booking request. Public - anyone visiting the site can do this.
router.post('/', bookingLimiter, (req, res) => {
  const { valid, errors } = validateBooking(req.body);
  if (!valid) {
    return res.status(400).json({ ok: false, errors });
  }

  const booking = {
    id: crypto.randomUUID(),
    type: req.body.type,
    itemId: sanitize(req.body.itemId),
    itemName: sanitize(req.body.itemName),
    name: sanitize(req.body.name),
    email: sanitize(req.body.email),
    phone: sanitize(req.body.phone),
    date: req.body.date,
    guests: Number(req.body.guests),
    notes: req.body.notes ? sanitize(req.body.notes) : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.get('bookings').push(booking).write();

  res.status(201).json({ ok: true, booking });
});

// List all bookings. Staff/admin only.
router.get('/', requireAuth, (req, res) => {
  const bookings = db.get('bookings').orderBy(['createdAt'], ['desc']).value();
  res.json(bookings);
});

// Update a booking's status (pending / confirmed / cancelled). Staff/admin only.
router.patch('/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }
  const booking = db.get('bookings').find({ id: req.params.id });
  if (!booking.value()) return res.status(404).json({ ok: false, error: 'Booking not found.' });
  booking.assign({ status }).write();
  res.json({ ok: true, booking: booking.value() });
});

module.exports = router;
