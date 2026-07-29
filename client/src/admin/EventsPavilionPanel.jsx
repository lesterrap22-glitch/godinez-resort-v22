import { useEffect, useState } from 'react';
import { apiAdmin } from './adminApi.js';

// Same structure as RestaurantPanel.jsx (single-venue content, not a list),
// just pointed at the events-pavilion endpoints and fields instead.
const SIMPLE_FIELDS = [
  { key: 'name', label: 'Pavilion name', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'capacity', label: 'Capacity', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function EventsPavilionPanel() {
  const [pavilion, setPavilion] = useState(null);
  const [values, setValues] = useState({});
  const [highlights, setHighlights] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoStatus, setPhotoStatus] = useState({ text: '', kind: '' });
  const [saveStatus, setSaveStatus] = useState({ text: '', kind: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiAdmin('/api/admin/content/events-pavilion')
      .then((res) => res.json())
      .then((r) => {
        setPavilion(r);
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
      const res = await apiAdmin('/api/admin/content/events-pavilion/photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPhotoStatus({ text: data.error || 'Upload failed.', kind: 'error' });
        return;
      }
      setPhotoUrl(`${data.eventsPavilion.photoUrl}?t=${Date.now()}`);
      setPhotoStatus({ text: 'Photo updated.', kind: 'ok' });
    } catch (err) {
      if (err.message !== 'Not authenticated') setPhotoStatus({ text: 'Upload failed.', kind: 'error' });
    }
  }

  async function handleSave() {
    const body = { ...values, highlights };
    setSaving(true);
    try {
      const res = await apiAdmin('/api/admin/content/events-pavilion', {
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

  if (!pavilion) return <p>Loading...</p>;

  return (
    <div className="edit-card">
      <h3>Events Pavilion Details</h3>
      <div className="photo-row">
        {photoUrl ? <img src={photoUrl} alt={pavilion.name} /> : <p className="meta">No photo yet - shows a themed icon on the site until one is uploaded.</p>}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
        <span className={`status ${photoStatus.kind}`}>{photoStatus.text}</span>
      </div>
      <div className="field-grid">
        {SIMPLE_FIELDS.map((field) => (
          <div className="field-row" key={field.key}>
            <label htmlFor={`events-${field.key}`}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea id={`events-${field.key}`} value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            ) : (
              <input id={`events-${field.key}`} type="text" value={values[field.key] || ''} onChange={(e) => setField(field.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div>
        <label>Highlights</label>
        <div>
          {highlights.map((h, i) => (
            <div className="highlight-row" key={i}>
              <input type="text" placeholder="Highlight name" value={h.name} onChange={(e) => updateHighlight(i, 'name', e.target.value)} />
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
