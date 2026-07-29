// Small fetch helper shared by every page. Talks to the same /api/* routes
// the old vanilla-JS front-end used - the Express backend is unchanged.
export async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Some endpoints (rare) may not return a body; ignore parse failures.
  }
  if (!res.ok) {
    const err = new Error(`Request to ${url} failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
