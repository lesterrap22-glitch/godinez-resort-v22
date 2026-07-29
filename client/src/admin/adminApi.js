// Same idea as admin-dashboard.js's api() helper: any 401 bounces to the
// login page (with ?next= back to the dashboard) instead of leaving the
// tab looking broken.
export function goToLogin() {
  window.location.href = `admin-login.html?next=${encodeURIComponent('admin-dashboard.html')}`;
}

export async function apiAdmin(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    goToLogin();
    throw new Error('Not authenticated');
  }
  return res;
}
