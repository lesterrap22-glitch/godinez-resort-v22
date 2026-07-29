import { useState } from 'react';
import { apiAdmin } from './adminApi.js';

export default function AccountPanel({ user }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [status, setStatus] = useState({ text: '', kind: '' });

  async function handleChange() {
    const res = await apiAdmin('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setStatus({ text: data.ok ? 'Password changed.' : (data.errors && data.errors.join(' ')) || 'Failed.', kind: data.ok ? 'ok' : 'error' });
    if (data.ok) {
      setCurrent('');
      setNext('');
    }
  }

  return (
    <div className="edit-card">
      <h3>Signed in as {user.displayName} ({user.role})</h3>
      <p>Change your own password below.</p>
      <div className="field-grid">
        <div className="field-row">
          <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="field-row">
          <input type="password" placeholder="New password (10+ chars)" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
      </div>
      <div className="save-row">
        <button type="button" className="btn-small" onClick={handleChange}>Change Password</button>
        <span className={`status ${status.kind}`}>{status.text}</span>
      </div>
    </div>
  );
}
