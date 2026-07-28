// User store for the admin/staff login system.
// Stored as a JSON file (server/store/users.json) with bcrypt-hashed
// passwords - never plaintext. There is deliberately NO default/seeded
// account: the very first visit to /admin.html walks whoever gets there
// first through creating the one admin account, so no factory-default
// password ever ships with the code (a common way these things get broken
// into). From then on, that admin can create staff accounts from the
// dashboard.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Lives under server/data/ (see DEPLOYMENT.md) so a persistent disk mounted
// there keeps accounts intact across restarts/redeploys once deployed.
const usersFile = path.join(__dirname, '..', 'data', 'store', 'users.json');

function ensureFile() {
  if (!fs.existsSync(usersFile)) {
    fs.mkdirSync(path.dirname(usersFile), { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(usersFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return { users: [] };
  }
}

function writeAll(data) {
  fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));
}

function hasAnyUsers() {
  return readAll().users.length > 0;
}

function findByUsername(username) {
  if (!username) return null;
  const norm = String(username).trim().toLowerCase();
  return readAll().users.find((u) => u.username.toLowerCase() === norm) || null;
}

function findById(id) {
  return readAll().users.find((u) => u.id === id) || null;
}

function listStaff() {
  // Safe-to-expose fields only (never the passwordHash).
  return readAll().users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,40}$/;

function validateNewUserInput({ username, password, displayName }) {
  const errors = [];
  if (!username || !USERNAME_RE.test(username)) {
    errors.push('Username must be 3-40 characters: letters, numbers, dots, dashes, underscores only.');
  }
  if (!password || String(password).length < 10) {
    errors.push('Password must be at least 10 characters.');
  }
  if (!displayName || String(displayName).trim().length === 0) {
    errors.push('Display name is required.');
  }
  return errors;
}

// Creates the very first account (always role "admin"). Only allowed while
// the user store is empty - see requireNoUsersYet in the setup route.
function createFirstAdmin({ username, password, displayName }) {
  const data = readAll();
  const passwordHash = bcrypt.hashSync(password, 12);
  const user = {
    id: crypto.randomUUID(),
    username: username.trim(),
    displayName: displayName.trim(),
    role: 'admin',
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  data.users.push(user);
  writeAll(data);
  return user;
}

// Admin-only: create a staff (or additional admin) account.
function createUser({ username, password, displayName, role }) {
  const data = readAll();
  const passwordHash = bcrypt.hashSync(password, 12);
  const user = {
    id: crypto.randomUUID(),
    username: username.trim(),
    displayName: displayName.trim(),
    role: role === 'admin' ? 'admin' : 'staff',
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  data.users.push(user);
  writeAll(data);
  return user;
}

function deleteUser(id) {
  const data = readAll();
  const before = data.users.length;
  data.users = data.users.filter((u) => u.id !== id);
  writeAll(data);
  return data.users.length < before;
}

function verifyPassword(user, password) {
  if (!user || !password) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

function setPassword(id, newPassword) {
  const data = readAll();
  const user = data.users.find((u) => u.id === id);
  if (!user) return false;
  user.passwordHash = bcrypt.hashSync(newPassword, 12);
  writeAll(data);
  return true;
}

module.exports = {
  hasAnyUsers,
  findByUsername,
  findById,
  listStaff,
  validateNewUserInput,
  createFirstAdmin,
  createUser,
  deleteUser,
  verifyPassword,
  setPassword,
};
