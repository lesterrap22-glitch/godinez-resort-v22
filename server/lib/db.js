// Tiny JSON-file database for storing guest bookings/reservations.
// Uses lowdb so there is no native module to compile - just plain JSON on disk
// at server/data/store/bookings.json. Open that file directly if you ever
// want to peek at or edit bookings by hand. Lives under server/data/ so a
// single persistent disk mount there keeps bookings safe across
// restarts/redeploys once this is deployed - see DEPLOYMENT.md.
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbFile = path.join(__dirname, '..', 'data', 'store', 'bookings.json');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const adapter = new FileSync(dbFile);
const db = low(adapter);

db.defaults({ bookings: [] }).write();

module.exports = db;
