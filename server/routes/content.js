// Read-only endpoints that serve the resort's catalog data (villas, pools,
// activities, tours, restaurant info) from the JSON files in server/content/.
// These are read fresh from disk on every request (see lib/contentStore.js),
// so edits made through the admin dashboard - or by hand-editing a JSON file
// - show up immediately, with no server restart needed.
const express = require('express');
const router = express.Router();
const store = require('../lib/contentStore');
const themes = require('../lib/themes');

router.get('/villas', (req, res) => res.json(store.read('villas')));
router.get('/pools', (req, res) => res.json(store.read('pools')));
router.get('/activities', (req, res) => res.json(store.read('activities')));
router.get('/tours', (req, res) => res.json(store.read('tours')));
router.get('/restaurant', (req, res) => res.json(store.read('restaurant')));

// Current color theme, as CSS custom-property values the front-end applies
// on load (see public/js/main.js applyTheme()).
router.get('/theme', (req, res) => {
  const { themeId } = store.read('theme');
  res.json({ themeId, vars: themes.getVars(themeId) });
});

module.exports = router;
