// Admin-only content editing: text fields, photo uploads, and color theme.
// Every route here requires requireAdmin (see server/index.js wiring).
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();
const store = require('../lib/contentStore');
const themes = require('../lib/themes');
const { sanitize } = require('../lib/validate');

// Lives under server/data/ (see DEPLOYMENT.md) rather than public/images so
// that a single persistent disk mounted at server/data/ is enough to keep
// every uploaded photo across restarts/redeploys once deployed. server/index.js
// serves this folder at the public /images/ URL path.
const imagesDir = path.join(__dirname, '..', 'data', 'images');

// Photos are held in memory only long enough to validate + write them out
// under a name we control (never the client-supplied filename, which
// sidesteps any path-traversal shenanigans in the original name).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// Recognize real image files by their magic bytes rather than trusting the
// browser-supplied Content-Type or file extension, either of which is
// trivial to fake.
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', check: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', check: (b) => b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a' },
  { ext: 'webp', mime: 'image/webp', check: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

function detectImageType(buffer) {
  return SIGNATURES.find((s) => s.check(buffer)) || null;
}

const SECTIONS = {
  villas: {
    isList: true,
    fields: ['name', 'description', 'priceNote', 'amenities'],
    numberFields: ['capacity', 'bedrooms'],
  },
  pools: {
    isList: true,
    fields: ['name', 'description', 'depth'],
    numberFields: [],
  },
  activities: {
    isList: true,
    fields: ['name', 'description', 'effort', 'whyItWorks'],
    numberFields: [],
  },
  tours: {
    isList: true,
    fields: ['name', 'city', 'description'],
    numberFields: [],
  },
};

function cleanString(v, maxLen = 2000) {
  if (v === undefined || v === null) return undefined;
  return sanitize(String(v).trim().slice(0, maxLen));
}

// --- Restaurant & Events Pavilion: singleton sections ---
// These GET routes must be registered before the generic '/content/:section'
// route below - Express matches routes in registration order, and
// '/content/:section' matches a path like '/content/restaurant' just as
// well as any list-section name, so it would otherwise intercept these
// requests and return a false "Unknown section." 404 before ever reaching
// the specific handlers here. (This was actually happening for GET
// /content/restaurant until this reordering - PUT/POST were unaffected
// since their generic counterpart requires an extra /:id segment.)

router.get('/content/restaurant', (req, res) => {
  res.json(store.read('restaurant'));
});

router.put('/content/restaurant', (req, res) => {
  const restaurant = store.read('restaurant');
  const body = req.body || {};

  for (const field of ['name', 'tagline', 'hours', 'notes']) {
    if (body[field] !== undefined) restaurant[field] = cleanString(body[field], field === 'notes' ? 500 : 200);
  }
  if (Array.isArray(body.highlights)) {
    restaurant.highlights = body.highlights
      .slice(0, 12)
      .map((h) => ({
        name: cleanString(h && h.name, 100) || '',
        description: cleanString(h && h.description, 300) || '',
      }))
      .filter((h) => h.name);
  }

  store.write('restaurant', restaurant);
  res.json({ ok: true, restaurant });
});

router.post('/content/restaurant/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No photo uploaded.' });
  const detected = detectImageType(req.file.buffer);
  if (!detected) {
    return res.status(400).json({ ok: false, error: 'That file does not look like a valid JPG, PNG, or WEBP image.' });
  }
  const restaurant = store.read('restaurant');
  const filename = `restaurant-${crypto.randomBytes(4).toString('hex')}.${detected.ext}`;
  fs.writeFileSync(path.join(imagesDir, filename), req.file.buffer);
  restaurant.photoUrl = `images/${filename}`;
  store.write('restaurant', restaurant);
  res.json({ ok: true, restaurant });
});

router.get('/content/events-pavilion', (req, res) => {
  res.json(store.read('eventsPavilion'));
});

router.put('/content/events-pavilion', (req, res) => {
  const eventsPavilion = store.read('eventsPavilion');
  const body = req.body || {};

  for (const field of ['name', 'tagline', 'capacity', 'notes']) {
    if (body[field] !== undefined) eventsPavilion[field] = cleanString(body[field], field === 'notes' ? 500 : 200);
  }
  if (Array.isArray(body.highlights)) {
    eventsPavilion.highlights = body.highlights
      .slice(0, 12)
      .map((h) => ({
        name: cleanString(h && h.name, 100) || '',
        description: cleanString(h && h.description, 300) || '',
      }))
      .filter((h) => h.name);
  }

  store.write('eventsPavilion', eventsPavilion);
  res.json({ ok: true, eventsPavilion });
});

router.post('/content/events-pavilion/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No photo uploaded.' });
  const detected = detectImageType(req.file.buffer);
  if (!detected) {
    return res.status(400).json({ ok: false, error: 'That file does not look like a valid JPG, PNG, or WEBP image.' });
  }
  const eventsPavilion = store.read('eventsPavilion');
  const filename = `events-pavilion-${crypto.randomBytes(4).toString('hex')}.${detected.ext}`;
  fs.writeFileSync(path.join(imagesDir, filename), req.file.buffer);
  eventsPavilion.photoUrl = `images/${filename}`;
  store.write('eventsPavilion', eventsPavilion);
  res.json({ ok: true, eventsPavilion });
});

// --- Villas / Pools / Activities / Tours: list-based sections ---

router.get('/content/:section', (req, res) => {
  const section = SECTIONS[req.params.section];
  if (!section) return res.status(404).json({ ok: false, error: 'Unknown section.' });
  res.json(store.read(req.params.section));
});

router.put('/content/:section/:id', (req, res) => {
  const key = req.params.section;
  const section = SECTIONS[key];
  if (!section) return res.status(404).json({ ok: false, error: 'Unknown section.' });

  const items = store.read(key);
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Item not found.' });

  const body = req.body || {};
  for (const field of section.fields) {
    if (body[field] === undefined) continue;
    if (field === 'amenities') {
      const raw = body.amenities;
      const list = Array.isArray(raw)
        ? raw
        : String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      item.amenities = list.slice(0, 20).map((s) => cleanString(s, 80));
    } else {
      item[field] = cleanString(body[field], field === 'description' ? 2000 : 300);
    }
  }
  for (const field of section.numberFields) {
    if (body[field] === undefined) continue;
    const n = Number(body[field]);
    if (Number.isInteger(n) && n >= 0 && n <= 100) item[field] = n;
  }

  store.write(key, items);
  res.json({ ok: true, item });
});

router.post('/content/:section/:id/photo', upload.single('photo'), (req, res) => {
  const key = req.params.section;
  const section = SECTIONS[key];
  if (!section) return res.status(404).json({ ok: false, error: 'Unknown section.' });
  if (!req.file) return res.status(400).json({ ok: false, error: 'No photo uploaded.' });

  const detected = detectImageType(req.file.buffer);
  if (!detected) {
    return res.status(400).json({ ok: false, error: 'That file does not look like a valid JPG, PNG, or WEBP image.' });
  }

  const items = store.read(key);
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Item not found.' });

  const filename = `${req.params.id}-${crypto.randomBytes(4).toString('hex')}.${detected.ext}`;
  fs.writeFileSync(path.join(imagesDir, filename), req.file.buffer);

  item.photoUrl = `images/${filename}`;
  // A freshly uploaded photo isn't the old (possibly externally-credited)
  // photo anymore, so any old attribution no longer applies.
  if (item.photoCredit !== undefined) item.photoCredit = '';

  store.write(key, items);
  res.json({ ok: true, item });
});

// --- Theme ---

router.get('/theme-options', (req, res) => {
  res.json({ ok: true, themes: themes.list(), current: store.read('theme').themeId });
});

router.put('/theme', (req, res) => {
  const { themeId } = req.body || {};
  if (!themes.isValidThemeId(themeId)) {
    return res.status(400).json({ ok: false, error: 'Unknown theme.' });
  }
  store.write('theme', { themeId });
  res.json({ ok: true, themeId });
});

module.exports = router;
