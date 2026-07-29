import { useEffect, useRef, useState } from 'react';
import { fetchJSON } from './api.js';

function redirectTarget() {
  return new URLSearchParams(window.location.search).get('next') || 'admin.html';
}

// First-run "create the admin account" setup, then the normal login form
// afterward - same one-page-two-modes behavior as admin-login.js.
export default function AdminLoginApp() {
  const [mode, setMode] = useState('login'); // or 'setup'
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const displayNameRef = useRef(null);

  useEffect(() => {
    fetchJSON('/api/auth/setup-status')
      .then((data) => {
        if (data.needsSetup) setMode('setup');
      })
      .catch((err) => console.error(err));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback({ text: '', kind: '' });
    setSubmitting(true);

    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value;
    const displayName = mode === 'setup' ? displayNameRef.current.value.trim() : undefined;

    const url = mode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
    const body = mode === 'setup' ? { username, password, displayName } : { username, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const msg = (data.errors && data.errors.join(' ')) || data.error || 'Login failed.';
        setFeedback({ text: msg, kind: 'error' });
        setSubmitting(false);
        return;
      }
      setFeedback({
        text: mode === 'setup' ? 'Admin account created. Redirecting...' : 'Logged in. Redirecting...',
        kind: 'ok',
      });
      window.location.href = redirectTarget();
    } catch (err) {
      setFeedback({ text: 'Network error - please try again.', kind: 'error' });
      setSubmitting(false);
      console.error(err);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>{mode === 'setup' ? 'Create the Admin Account' : 'Staff / Admin Login'}</h1>
        {mode === 'setup' && (
          <div className="setup-note">
            No admin account exists yet. Create the one admin account now - keep these credentials safe, since this
            form only ever appears once.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {mode === 'setup' && (
            <div>
              <label htmlFor="displayName">Your name</label>
              <input ref={displayNameRef} type="text" id="displayName" maxLength={100} autoComplete="name" required />
            </div>
          )}
          <label htmlFor="username">Username</label>
          <input ref={usernameRef} type="text" id="username" maxLength={40} autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <input ref={passwordRef} type="password" id="password" autoComplete="current-password" required />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {mode === 'setup' ? 'Create Admin Account' : 'Log In'}
          </button>
          <p className={`login-feedback ${feedback.kind}`} role="status">{feedback.text}</p>
        </form>
        <p style={{ marginTop: '16px', fontSize: '0.85rem' }}><a href="index.html">&larr; Back to site</a></p>
      </div>
    </div>
  );
}
