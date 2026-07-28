// Internal staff view: lists every booking request submitted through the
// site, lets staff/admin update its status, and filter by type/status.
// Requires being logged in (see admin-login.html) - if the session check
// below fails, this redirects there automatically.
// Uses textContent (never innerHTML with raw data) when rendering guest
// input, so nothing a guest typed can execute as HTML/script on this page.

let allBookings = [];

function goToLogin() {
  window.location.href = `admin-login.html?next=${encodeURIComponent('admin.html')}`;
}

async function checkAuth() {
  const res = await fetch('/api/auth/me');
  if (res.status === 401) {
    goToLogin();
    return null;
  }
  const data = await res.json();
  return data.user;
}

function renderTable() {
  const target = document.getElementById('bookings-table');
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;

  const rows = allBookings.filter((b) => {
    if (typeFilter && b.type !== typeFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  if (!rows.length) {
    target.innerHTML = '';
    target.appendChild(Object.assign(document.createElement('p'), { className: 'empty', textContent: 'No matching booking requests.' }));
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Submitted</th><th>Type</th><th>Item</th><th>Guest</th><th>Contact</th><th>Date</th><th>Guests</th><th>Notes</th><th>Status</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((b) => {
    const tr = document.createElement('tr');
    const cells = [
      new Date(b.createdAt).toLocaleString(),
      b.type,
      b.itemName,
      b.name,
      `${b.email} / ${b.phone}`,
      b.date,
      String(b.guests),
      b.notes || '-',
    ];
    cells.forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });

    const statusTd = document.createElement('td');
    const select = document.createElement('select');
    select.className = `status-select ${b.status}`;
    ['pending', 'confirmed', 'cancelled'].forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s[0].toUpperCase() + s.slice(1);
      if (s === b.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        const res = await fetch(`/api/bookings/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: select.value }),
        });
        if (!res.ok) throw new Error('Update failed');
        b.status = select.value;
        select.className = `status-select ${b.status}`;
      } catch (err) {
        alert('Could not update status - please try again.');
        console.error(err);
      } finally {
        select.disabled = false;
      }
    });
    statusTd.appendChild(select);
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  target.innerHTML = '';
  target.appendChild(table);
}

async function loadBookings() {
  const target = document.getElementById('bookings-table');
  try {
    const res = await fetch('/api/bookings');
    if (res.status === 401) return goToLogin();
    allBookings = await res.json();
    renderTable();
  } catch (err) {
    target.textContent = 'Failed to load bookings.';
    console.error(err);
  }
}

document.getElementById('filter-type').addEventListener('change', renderTable);
document.getElementById('filter-status').addEventListener('change', renderTable);
document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  goToLogin();
});

(async () => {
  const user = await checkAuth();
  if (!user) return;
  document.getElementById('who').textContent = `Logged in as ${user.displayName} (${user.role})`;
  if (user.role === 'admin') document.getElementById('dashboard-link').hidden = false;
  loadBookings();
})();
