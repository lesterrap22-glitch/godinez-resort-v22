// Tracks which session IDs belong to which user, purely in-process memory.
// express-session has no built-in "kill every session belonging to user X"
// operation, but AppSec baseline requirement 7.4.2 requires that deleting or
// disabling an account immediately ends its active sessions - not just
// "the next request happens to notice the account is gone". This small
// registry is what makes that immediate kill possible: track(...) on login,
// untrack(...) on logout, and destroyAllForUser(...) when an admin removes
// an account.
const byUser = new Map(); // userId -> Set<sessionId>

function track(userId, sessionId) {
  if (!byUser.has(userId)) byUser.set(userId, new Set());
  byUser.get(userId).add(sessionId);
}

function untrack(userId, sessionId) {
  const set = byUser.get(userId);
  if (set) {
    set.delete(sessionId);
    if (set.size === 0) byUser.delete(userId);
  }
}

// Destroys every session currently open for this user, via the same
// session store express-session is using (works for MemoryStore and for
// any drop-in replacement store).
function destroyAllForUser(sessionStore, userId) {
  const set = byUser.get(userId);
  if (!set || set.size === 0) return;
  for (const sid of set) {
    sessionStore.destroy(sid, () => {});
  }
  byUser.delete(userId);
}

module.exports = { track, untrack, destroyAllForUser };
