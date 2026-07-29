import { useCallback, useEffect, useMemo, useState } from 'react';

// Internal staff view: lists every booking request, lets staff/admin update
// its status, and filter by type/status. Requires being logged in - a 401
// from any request sends you to admin-login.html, same as admin.js did.

function goToLogin() {
  window.location.href = `admin-login.html?next=${encodeURIComponent('admin.html')}`;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled'];

function StatusSelect({ booking, onChanged }) {
  const [status, setStatus] = useState(booking.status);
  const [busy, setBusy] = useState(false);

  async function handleChange(e) {
    const next = e.target.value;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Update failed');
      setStatus(next);
      onChanged(booking.id, next);
    } catch (err) {
      alert('Could not update status - please try again.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select className={`status-select ${status}`} value={status} disabled={busy} onChange={handleChange}>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.status === 401) return goToLogin();
      setBookings(await res.json());
    } catch (err) {
      setLoadError(true);
      console.error(err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) return goToLogin();
        const data = await res.json();
        setUser(data.user);
        loadBookings();
      } catch (err) {
        goToLogin();
      }
    })();
  }, [loadBookings]);

  function handleStatusChanged(id, status) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goToLogin();
  }

  const rows = useMemo(
    () =>
      bookings.filter((b) => {
        if (typeFilter && b.type !== typeFilter) return false;
        if (statusFilter && b.status !== statusFilter) return false;
        return true;
      }),
    [bookings, typeFilter, statusFilter]
  );

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div>
          <h1 style={{ marginBottom: '4px' }}>Booking Requests</h1>
          <div className="who">{user ? `Logged in as ${user.displayName} (${user.role})` : 'Loading...'}</div>
        </div>
        <div className="links">
          {user && user.role === 'admin' && <a href="admin-dashboard.html">Content &amp; Settings &rarr;</a>}
          <button className="admin-logout-btn" type="button" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="filters">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="villa">Villa</option>
          <option value="tour">Tour</option>
          <option value="activity">Activity</option>
          <option value="restaurant">Restaurant</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loadError && <p className="admin-empty">Failed to load bookings.</p>}
      {!loadError && rows.length === 0 && <p className="admin-empty">No matching booking requests.</p>}
      {!loadError && rows.length > 0 && (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Submitted</th><th>Type</th><th>Item</th><th>Guest</th><th>Contact</th>
              <th>Date</th><th>Guests</th><th>Notes</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.createdAt).toLocaleString()}</td>
                <td>{b.type}</td>
                <td>{b.itemName}</td>
                <td>{b.name}</td>
                <td>{b.email} / {b.phone}</td>
                <td>{b.date}</td>
                <td>{b.guests}</td>
                <td>{b.notes || '-'}</td>
                <td><StatusSelect booking={b} onChanged={handleStatusChanged} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p><a href="index.html">&larr; Back to site</a></p>
    </div>
  );
}
