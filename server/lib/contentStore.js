// Reads/writes the JSON files in server/content/ fresh from disk every time
// (no require() caching), so that edits made through the admin dashboard -
// or by hand-editing a JSON file, like the README has always suggested -
// show up on the site immediately without restarting the server.
const fs = require('fs');
const path = require('path');

// Lives under server/data/ (rather than directly in server/) so that, once
// deployed, a single persistent disk mounted at server/data/ is enough to
// preserve every admin edit, uploaded photo, and booking across restarts and
// redeploys - see DEPLOYMENT.md.
const contentDir = path.join(__dirname, '..', 'data', 'content');

const FILES = {
  villas: 'villas.json',
  pools: 'pools.json',
  activities: 'activities.json',
  tours: 'tours.json',
  restaurant: 'restaurant.json',
  eventsPavilion: 'events-pavilion.json',
  theme: 'theme.json',
};

function filePath(key) {
  if (!FILES[key]) throw new Error(`Unknown content key: ${key}`);
  return path.join(contentDir, FILES[key]);
}

function read(key) {
  const raw = fs.readFileSync(filePath(key), 'utf8');
  return JSON.parse(raw);
}

// Atomic-ish write: write to a temp file then rename over the original, so a
// crash mid-write can't leave a half-written (corrupt) JSON file behind.
function write(key, data) {
  const target = filePath(key);
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

module.exports = { read, write };
