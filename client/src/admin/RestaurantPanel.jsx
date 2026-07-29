import { useEffect, useState } from 'react';
import { apiAdmin } from './adminApi.js';

const SIMPLE_FIELDS = [
  { key: 'name', label: 'Restaurant name', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'hours', label: 'Hours', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function RestaurantPanel() {
  const [restaurant, setRestaurant] = useState(null);
  const [values, setValues] = useState({});
  const [highlights, setHighlights] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoStatus, setPhotoStatus] = useState({ text: '', kind: '' });
  const [saveStatus, setSaveStatus] = useState({ text: '', kind: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiAdmin('/api/admin/content/restaurant')
      .then((res) => res.json())
      .then((r) => {
        setRestaurant(r);
        setPhotoUrl(r.photoUrl || '');
        const v = {};
        SIMPLE_FIELDS.forEach((f) => { v[f.key] = r[f.key] ?? ''; });
        setValues(v);
        setHighlights((r.highlights || []).map((h) => ({ name: h.name || '', description: h.description || '' })));
      })
      .catch((err) => {
        if (err.message !== 'Not authenticated') console.error(err);
      });
  }, []);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateHighlight(index, key, value) {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, [key]: value } : h)));
  }

  function removeHighlight(index) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }

  function addHighlight() {
    setHighlights((prev) => [...prev, { name: '', description: '' }]);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await apiAdmin('/api/admin/content/restaurant/photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPhotoStatus({ text: data.error || 'Upload failed.', kind: 'error' });
        return;
      }
      setPhotoUrl(`${data.restaurant.photoUrl}?t=${Date.now()}`);
      setPhotoStatus({ text: 'Photo updated.', kind: 'ok' });
    } catch (err) {
      if (err.message !== 'Not authenticated') setPhotoStatus({ text: 'Upload failed.', kind: 'error' });
    }
  }

  async function handleSave() {
    const body = { ...values, highlights };
    setSaving(true);
    try {
      const res = await apiAdmin('/api/admin/content/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSaveStatus({ text: data.ok ? 'Saved.' : data.error || 'Save failed.', kind: data.ok ? 'ok' : 'error' });
    } catch (err) {
      if (err.message !== 'Not authenticated') setSaveStatus({ text: 'Save failed.', kind: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!restaurant) return <p>Loading...</p>;

  return (
    <div className="edit-card">
      <h3>G-Resto Details</h3>
      <div className="photo-row">
        <img src={photoUrl} alt={restaurant.name} />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
        <span className={`status ${photoStatus.kind}`}>{photoStatus.text}</span>
      </div>
      <div className="field-grid">
        {SIMPLE_FIELDS.map((field) => (
          <div className="field-row" key={field.key}>
            <label htmlFor={`rest-${field.key}`}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea id={`rest-${field.key}`} value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            ) : (
              <input id={`rest-${field.key}`} type="text" value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div>
        <label>Menu Highlights</label>
        <div>
          {highlights.map((h, i) => (
            <div className="highlight-row" key={i}>
              <input type="text" placeholder="Dish name" value={h.name} onChange={(e) => updateHighlight(i, 'name', e.target.value)} />
              <input type="text" placeholder="Description" value={h.description} onChange={(e) => updateHighlight(i, 'description', e.target.value)} />
              <button type="button" className="btn-small secondary" onClick={() => removeHighlight(i)}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-small secondary" style={{ marginTop: '6px' }} onClick={addHighlight}>+ Add Highlight</button>
      </div>

      <div className="save-row" style={{ marginTop: '16px' }}>
        <button type="button" className="btn-small" disabled={saving} onClick={handleSave}>Save Changes</button>
        <span className={`status ${saveStatus.kind}`}>{saveStatus.text}</span>
      </div>
    </div>
  );
}
