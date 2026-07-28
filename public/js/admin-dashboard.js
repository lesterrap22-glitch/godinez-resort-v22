// Admin content-editing dashboard: text fields, photo uploads, color theme,
// and staff account management. Every write here calls an /api/admin/*
// route, which the server rejects unless the logged-in user has the
// "admin" role (see server/middleware/auth.js) - the checks in this file
// are just for a clean UI, not the real security boundary.

// Renders the third argument as plain text (textContent), never as HTML -
// same reasoning as public/js/main.js's el(): this dashboard displays text
// that other staff/admin accounts entered, so treating it as markup would
// let one compromised admin account inject a script that runs for every
// other admin viewing this page.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function goToLogin() {
  window.location.href = `admin-login.html?next=${encodeURIComponent('admin-dashboard.html')}`;
}

async function api(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    goToLogin();
    throw new Error('Not authenticated');
  }
  return res;
}

// --- Section configs (mirrors the whitelist in server/routes/admin.js) ---

const LIST_SECTIONS = {
  villas: {
    title: 'Villas',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priceNote', label: 'Price note', type: 'text' },
      { key: 'capacity', label: 'Sleeps up to (guests)', type: 'number' },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
      { key: 'amenities', label: 'Amenities (comma-separated)', type: 'text', isCsv: true },
    ],
  },
  pools: {
    title: 'Pools',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'depth', label: 'Depth', type: 'text' },
    ],
  },
  activities: {
    title: 'Activities',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'effort', label: 'Effort (Low / Medium / High)', type: 'text' },
      { key: 'whyItWorks', label: 'Why it works', type: 'textarea' },
    ],
  },
  tours: {
    title: 'Travel & Tours',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
};

function fieldInput(field, value) {
  const wrap = el('div', 'field-row');
  const label = el('label', null, field.label);
  label.setAttribute('for', `f-${field.key}`);
  wrap.appendChild(label);
  const input = el(field.type === 'textarea' ? 'textarea' : 'input');
  input.id = `f-${field.key}`;
  input.dataset.key = field.key;
  if (field.type !== 'textarea') input.type = field.type;
  input.value = field.isCsv ? (Array.isArray(value) ? value.join(', ') : value || '') : (value ?? '');
  wrap.appendChild(input);
  return { wrap, input };
}

function statusEl() {
  return el('span', 'status');
}

function setStatus(node, message, isError) {
  node.textContent = message;
  node.className = `status ${isError ? 'error' : 'ok'}`;
  if (message) setTimeout(() => { node.textContent = ''; }, 4000);
}

async function uploadPhoto(url, file, imgEl, status) {
  const formData = new FormData();
  formData.append('photo', file);
  try {
    const res = await api(url, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setStatus(status, data.error || 'Upload failed.', true);
      return;
    }
    const item = data.item || data.restaurant;
    imgEl.src = `${item.photoUrl}?t=${Date.now()}`;
    setStatus(status, 'Photo updated.', false);
  } catch (err) {
    if (err.message !== 'Not authenticated') setStatus(status, 'Upload failed.', true);
  }
}

function renderListSection(sectionKey) {
  const config = LIST_SECTIONS[sectionKey];
  const panel = document.getElementById(`panel-${sectionKey}`);
  return api(`/api/admin/content/${sectionKey}`)
    .then((res) => res.json())
    .then((items) => {
      panel.innerHTML = '';
      items.forEach((item) => {
        const card = el('div', 'edit-card');
        card.appendChild(el('h3', null, item.name));

        if (item.photoUrl) {
          const photoRow = el('div', 'photo-row');
          const img = el('img');
          img.src = item.photoUrl;
          img.alt = item.name;
          photoRow.appendChild(img);
          const fileInput = el('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/jpeg,image/png,image/webp';
          photoRow.appendChild(fileInput);
          const uploadStatus = statusEl();
          photoRow.appendChild(uploadStatus);
          fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) {
              uploadPhoto(`/api/admin/content/${sectionKey}/${item.id}/photo`, fileInput.files[0], img, uploadStatus);
            }
          });
          card.appendChild(photoRow);
        }

        const grid = el('div', 'field-grid');
        const inputs = [];
        config.fields.forEach((field) => {
          const { wrap, input } = fieldInput(field, item[field.key]);
          inputs.push({ field, input });
          grid.appendChild(wrap);
        });
        card.appendChild(grid);

        const saveRow = el('div', 'save-row');
        const saveBtn = el('button', 'btn-small', 'Save Changes');
        saveBtn.type = 'button';
        const status = statusEl();
        saveBtn.addEventListener('click', async () => {
          const body = {};
          inputs.forEach(({ field, input }) => {
            body[field.key] = field.isCsv ? input.value : (field.type === 'number' ? Number(input.value) : input.value);
          });
          saveBtn.disabled = true;
          try {
            const res = await api(`/api/admin/content/${sectionKey}/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data = await res.json();
            setStatus(status, data.ok ? 'Saved.' : (data.error || 'Save failed.'), !data.ok);
            if (data.ok) card.querySelector('h3').textContent = data.item.name;
          } catch (err) {
            if (err.message !== 'Not authenticated') setStatus(status, 'Save failed.', true);
          } finally {
            saveBtn.disabled = false;
          }
        });
        saveRow.appendChild(saveBtn);
        saveRow.appendChild(status);
        card.appendChild(saveRow);

        panel.appendChild(card);
      });
    });
}

function renderRestaurant() {
  const panel = document.getElementById('panel-restaurant');
  return api('/api/admin/content/restaurant')
    .then((res) => res.json())
    .then((r) => {
      panel.innerHTML = '';
      const card = el('div', 'edit-card');
      card.appendChild(el('h3', null, 'G-Resto Details'));

      const photoRow = el('div', 'photo-row');
      const img = el('img');
      img.src = r.photoUrl || '';
      img.alt = r.name;
      photoRow.appendChild(img);
      const fileInput = el('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/jpeg,image/png,image/webp';
      photoRow.appendChild(fileInput);
      const uploadStatus = statusEl();
      photoRow.appendChild(uploadStatus);
      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) uploadPhoto('/api/admin/content/restaurant/photo', fileInput.files[0], img, uploadStatus);
      });
      card.appendChild(photoRow);

      const simpleFields = [
        { key: 'name', label: 'Restaurant name', type: 'text' },
        { key: 'tagline', label: 'Tagline', type: 'text' },
        { key: 'hours', label: 'Hours', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ];
      const grid = el('div', 'field-grid');
      const inputs = [];
      simpleFields.forEach((field) => {
        const { wrap, input } = fieldInput(field, r[field.key]);
        inputs.push({ field, input });
        grid.appendChild(wrap);
      });
      card.appendChild(grid);

      const highlightsWrap = el('div');
      highlightsWrap.appendChild(el('label', null, 'Menu Highlights'));
      const rowsWrap = el('div');
      function addHighlightRow(h = { name: '', description: '' }) {
        const row = el('div', 'highlight-row');
        const nameInput = el('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Dish name';
        nameInput.value = h.name || '';
        const descInput = el('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description';
        descInput.value = h.description || '';
        const removeBtn = el('button', 'btn-small secondary', 'Remove');
        removeBtn.type = 'button';
        removeBtn.addEventListener('click', () => row.remove());
        row.appendChild(nameInput);
        row.appendChild(descInput);
        row.appendChild(removeBtn);
        rowsWrap.appendChild(row);
      }
      (r.highlights || []).forEach((h) => addHighlightRow(h));
      highlightsWrap.appendChild(rowsWrap);
      const addBtn = el('button', 'btn-small secondary', '+ Add Highlight');
      addBtn.type = 'button';
      addBtn.style.marginTop = '6px';
      addBtn.addEventListener('click', () => addHighlightRow());
      highlightsWrap.appendChild(addBtn);
      card.appendChild(highlightsWrap);

      const saveRow = el('div', 'save-row');
      saveRow.style.marginTop = '16px';
      const saveBtn = el('button', 'btn-small', 'Save Changes');
      saveBtn.type = 'button';
      const status = statusEl();
      saveBtn.addEventListener('click', async () => {
        const body = {};
        inputs.forEach(({ field, input }) => { body[field.key] = input.value; });
        body.highlights = Array.from(rowsWrap.querySelectorAll('.highlight-row')).map((row) => {
          const [nameInput, descInput] = row.querySelectorAll('input');
          return { name: nameInput.value, description: descInput.value };
        });
        saveBtn.disabled = true;
        try {
          const res = await api('/api/admin/content/restaurant', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          setStatus(status, data.ok ? 'Saved.' : (data.error || 'Save failed.'), !data.ok);
        } catch (err) {
          if (err.message !== 'Not authenticated') setStatus(status, 'Save failed.', true);
        } finally {
          saveBtn.disabled = false;
        }
      });
      saveRow.appendChild(saveBtn);
      saveRow.appendChild(status);
      card.appendChild(saveRow);

      panel.appendChild(card);
    });
}

function renderTheme() {
  const panel = document.getElementById('panel-theme');
  return api('/api/admin/theme-options')
    .then((res) => res.json())
    .then((data) => {
      panel.innerHTML = '';
      const card = el('div', 'edit-card');
      card.appendChild(el('h3', null, 'Pick a Color Theme'));
      card.appendChild(el('p', null, 'Preset combinations only, so every option is guaranteed to look good and stay readable.'));
      const grid = el('div', 'theme-grid');
      const swatchColors = { forest: ['#234d35', '#d9a441'], ocean: ['#145c78', '#4fb3c9'], sunset: ['#7a3b1e', '#f0a63f'], orchid: ['#5c2d4d', '#e8a4c4'] };
      data.themes.forEach((t) => {
        const opt = el('div', `theme-option${t.id === data.current ? ' selected' : ''}`);
        opt.dataset.id = t.id;
        const swatches = el('div', 'theme-swatches');
        (swatchColors[t.id] || ['#ccc', '#eee']).forEach((c) => {
          const sw = el('span', 'theme-swatch');
          sw.style.background = c;
          swatches.appendChild(sw);
        });
        opt.appendChild(swatches);
        opt.appendChild(el('div', null, t.label));
        opt.addEventListener('click', async () => {
          try {
            const res = await api('/api/admin/theme', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ themeId: t.id }),
            });
            const result = await res.json();
            if (result.ok) {
              grid.querySelectorAll('.theme-option').forEach((o) => o.classList.remove('selected'));
              opt.classList.add('selected');
            }
          } catch (err) {
            console.error(err);
          }
        });
        grid.appendChild(opt);
      });
      card.appendChild(grid);
      panel.appendChild(card);
    });
}

function renderUsers(currentUserId) {
  const panel = document.getElementById('panel-users');
  return api('/api/auth/users')
    .then((res) => res.json())
    .then((data) => {
      panel.innerHTML = '';
      const card = el('div', 'edit-card');
      card.appendChild(el('h3', null, 'Staff Accounts'));

      const table = el('table', 'users-table');
      table.innerHTML = '<thead><tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr></thead>';
      const tbody = el('tbody');
      data.users.forEach((u) => {
        const tr = el('tr');
        [u.displayName, u.username, u.role].forEach((text) => {
          const td = el('td');
          td.textContent = text;
          tr.appendChild(td);
        });
        const actionTd = el('td');
        if (u.id !== currentUserId) {
          const delBtn = el('button', 'btn-small secondary', 'Remove');
          delBtn.type = 'button';
          delBtn.addEventListener('click', async () => {
            if (!confirm(`Remove account "${u.username}"?`)) return;
            await api(`/api/auth/users/${u.id}`, { method: 'DELETE' });
            renderUsers(currentUserId);
          });
          actionTd.appendChild(delBtn);
        } else {
          actionTd.textContent = '(you)';
        }
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      card.appendChild(table);

      const form = el('div');
      form.style.marginTop = '18px';
      form.appendChild(el('h3', null, 'Add Staff Account'));
      const grid = el('div', 'field-grid');
      const nameInput = el('input'); nameInput.type = 'text'; nameInput.placeholder = 'Display name';
      const userInput = el('input'); userInput.type = 'text'; userInput.placeholder = 'Username';
      const passInput = el('input'); passInput.type = 'password'; passInput.placeholder = 'Temporary password (10+ chars)';
      const roleSelect = el('select');
      ['staff', 'admin'].forEach((r) => {
        const opt = el('option', null, r[0].toUpperCase() + r.slice(1));
        opt.value = r;
        roleSelect.appendChild(opt);
      });
      [nameInput, userInput, passInput, roleSelect].forEach((i) => {
        const wrap = el('div', 'field-row');
        wrap.appendChild(i);
        grid.appendChild(wrap);
      });
      form.appendChild(grid);
      const addStatus = statusEl();
      const addBtn = el('button', 'btn-small', 'Add Account');
      addBtn.type = 'button';
      addBtn.addEventListener('click', async () => {
        const res = await api('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: nameInput.value, username: userInput.value, password: passInput.value, role: roleSelect.value }),
        });
        const result = await res.json();
        if (!result.ok) {
          setStatus(addStatus, (result.errors && result.errors.join(' ')) || 'Could not add account.', true);
          return;
        }
        setStatus(addStatus, 'Account created.', false);
        nameInput.value = ''; userInput.value = ''; passInput.value = '';
        renderUsers(currentUserId);
      });
      const saveRow = el('div', 'save-row');
      saveRow.appendChild(addBtn);
      saveRow.appendChild(addStatus);
      form.appendChild(saveRow);
      card.appendChild(form);

      panel.appendChild(card);
    });
}

function renderAccount(user) {
  const panel = document.getElementById('panel-account');
  panel.innerHTML = '';
  const card = el('div', 'edit-card');
  card.appendChild(el('h3', null, `Signed in as ${user.displayName} (${user.role})`));
  card.appendChild(el('p', null, 'Change your own password below.'));
  const grid = el('div', 'field-grid');
  const cur = el('input'); cur.type = 'password'; cur.placeholder = 'Current password';
  const next = el('input'); next.type = 'password'; next.placeholder = 'New password (10+ chars)';
  [cur, next].forEach((i) => {
    const wrap = el('div', 'field-row');
    wrap.appendChild(i);
    grid.appendChild(wrap);
  });
  card.appendChild(grid);
  const status = statusEl();
  const btn = el('button', 'btn-small', 'Change Password');
  btn.type = 'button';
  btn.addEventListener('click', async () => {
    const res = await api('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cur.value, newPassword: next.value }),
    });
    const data = await res.json();
    setStatus(status, data.ok ? 'Password changed.' : ((data.errors && data.errors.join(' ')) || 'Failed.'), !data.ok);
    if (data.ok) { cur.value = ''; next.value = ''; }
  });
  const saveRow = el('div', 'save-row');
  saveRow.appendChild(btn);
  saveRow.appendChild(status);
  card.appendChild(saveRow);
  panel.appendChild(card);
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  goToLogin();
});

(async () => {
  let user;
  try {
    const res = await fetch('/api/auth/me');
    if (res.status === 401) return goToLogin();
    user = (await res.json()).user;
  } catch (err) {
    return goToLogin();
  }

  if (user.role !== 'admin') {
    document.querySelector('.admin-wrap').innerHTML =
      '<p>This page is for admin accounts only. <a href="admin.html">Go to the bookings view instead &rarr;</a></p>';
    return;
  }

  document.getElementById('who').textContent = `Logged in as ${user.displayName} (${user.role})`;

  renderListSection('villas');
  renderListSection('pools');
  renderListSection('activities');
  renderListSection('tours');
  renderRestaurant();
  renderTheme();
  renderUsers(user.id);
  renderAccount(user);
})();
