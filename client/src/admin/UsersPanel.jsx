import { useCallback, useEffect, useState } from 'react';
import { apiAdmin } from './adminApi.js';

export default function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ displayName: '', username: '', password: '', role: 'staff' });
  const [addStatus, setAddStatus] = useState({ text: '', kind: '' });

  const loadUsers = useCallback(() => {
    apiAdmin('/api/auth/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users))
      .catch((err) => {
        if (err.message !== 'Not authenticated') console.error(err);
      });
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRemove(u) {
    if (!confirm(`Remove account "${u.username}"?`)) return;
    await apiAdmin(`/api/auth/users/${u.id}`, { method: 'DELETE' });
    loadUsers();
  }

  async function handleAdd() {
    const res = await apiAdmin('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!result.ok) {
      setAddStatus({ text: (result.errors && result.errors.join(' ')) || 'Could not add account.', kind: 'error' });
      return;
    }
    setAddStatus({ text: 'Account created.', kind: 'ok' });
    setForm({ displayName: '', username: '', password: '', role: 'staff' });
    loadUsers();
  }

  if (!users) return <p>Loading...</p>;

  return (
    <div className="edit-card">
      <h3>Staff Accounts</h3>
      <table className="users-table">
        <thead><tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.displayName}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>
                {u.id !== currentUserId ? (
                  <button type="button" className="btn-small secondary" onClick={() => handleRemove(u)}>Remove</button>
                ) : (
                  '(you)'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '18px' }}>
        <h3>Add Staff Account</h3>
        <div className="field-grid">
          <div className="field-row">
            <input type="text" placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="field-row">
            <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field-row">
            <input type="password" placeholder="Temporary password (10+ chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field-row">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="save-row">
          <button type="button" className="btn-small" onClick={handleAdd}>Add Account</button>
          <span className={`status ${addStatus.kind}`}>{addStatus.text}</span>
        </div>
      </div>
    </div>
  );
}
