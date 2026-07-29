import { useEffect, useState } from 'react';
import { goToLogin } from './admin/adminApi.js';
import ListSectionPanel from './admin/ListSectionPanel.jsx';
import RestaurantPanel from './admin/RestaurantPanel.jsx';
import ThemePanel from './admin/ThemePanel.jsx';
import UsersPanel from './admin/UsersPanel.jsx';
import AccountPanel from './admin/AccountPanel.jsx';

const TABS = [
  { key: 'villas', label: 'Villas' },
  { key: 'pools', label: 'Pools' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'activities', label: 'Activities' },
  { key: 'tours', label: 'Tours' },
  { key: 'theme', label: 'Color Theme' },
  { key: 'users', label: 'Staff Accounts' },
  { key: 'account', label: 'My Account' },
];

export default function AdminDashboardApp() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('villas');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) return goToLogin();
        const data = await res.json();
        setUser(data.user);
      } catch {
        goToLogin();
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goToLogin();
  }

  if (!checked) return null;

  if (user && user.role !== 'admin') {
    return (
      <div className="admin-wrap">
        <p>This page is for admin accounts only. <a href="admin.html">Go to the bookings view instead &rarr;</a></p>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div>
          <h1 style={{ marginBottom: '4px' }}>Content &amp; Settings</h1>
          <div className="who">{user ? `Logged in as ${user.displayName} (${user.role})` : 'Loading...'}</div>
        </div>
        <div className="links">
          <a href="admin.html" style={{ marginRight: '16px' }}>Bookings &rarr;</a>
          <button className="admin-logout-btn" type="button" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {['villas', 'pools', 'activities', 'tours'].map((key) => (
        <div key={key} className={`tab-panel${activeTab === key ? ' active' : ''}`}>
          {activeTab === key && <ListSectionPanel sectionKey={key} />}
        </div>
      ))}
      <div className={`tab-panel${activeTab === 'restaurant' ? ' active' : ''}`}>
        {activeTab === 'restaurant' && <RestaurantPanel />}
      </div>
      <div className={`tab-panel${activeTab === 'theme' ? ' active' : ''}`}>
        {activeTab === 'theme' && <ThemePanel />}
      </div>
      <div className={`tab-panel${activeTab === 'users' ? ' active' : ''}`}>
        {activeTab === 'users' && user && <UsersPanel currentUserId={user.id} />}
      </div>
      <div className={`tab-panel${activeTab === 'account' ? ' active' : ''}`}>
        {activeTab === 'account' && user && <AccountPanel user={user} />}
      </div>

      <p><a href="index.html">&larr; Back to site</a></p>
    </div>
  );
}
