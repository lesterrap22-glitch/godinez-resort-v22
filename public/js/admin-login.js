// Handles both states of this one page: first-run "create the admin
// account" setup, and the normal login form afterward.
const form = document.getElementById('login-form');
const feedback = document.getElementById('feedback');
const setupNote = document.getElementById('setup-note');
const displayNameField = document.getElementById('display-name-field');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');

let mode = 'login'; // or 'setup'

function params() {
  return new URLSearchParams(window.location.search);
}

function redirectTarget() {
  return params().get('next') || 'admin.html';
}

async function init() {
  try {
    const res = await fetch('/api/auth/setup-status');
    const data = await res.json();
    if (data.needsSetup) {
      mode = 'setup';
      setupNote.hidden = false;
      displayNameField.hidden = false;
      document.getElementById('displayName').required = true;
      formTitle.textContent = 'Create the Admin Account';
      submitBtn.textContent = 'Create Admin Account';
    }
  } catch (err) {
    console.error(err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedback.textContent = '';
  feedback.className = 'login-feedback';
  submitBtn.disabled = true;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const displayName = document.getElementById('displayName').value.trim();

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
      feedback.textContent = msg;
      feedback.className = 'login-feedback error';
      submitBtn.disabled = false;
      return;
    }
    feedback.textContent = mode === 'setup' ? 'Admin account created. Redirecting...' : 'Logged in. Redirecting...';
    feedback.className = 'login-feedback ok';
    window.location.href = redirectTarget();
  } catch (err) {
    feedback.textContent = 'Network error - please try again.';
    feedback.className = 'login-feedback error';
    submitBtn.disabled = false;
    console.error(err);
  }
});

init();
