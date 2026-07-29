import { useEffect, useState } from 'react';
import { apiAdmin } from './adminApi.js';

// Field configs mirror the whitelist in server/routes/admin.js.
export const LIST_SECTIONS = {
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

function initialValues(fields, item) {
  const values = {};
  fields.forEach((field) => {
    const raw = item[field.key];
    values[field.key] = field.isCsv ? (Array.isArray(raw) ? raw.join(', ') : raw || '') : (raw ?? '');
  });
  return values;
}

function ItemEditCard({ sectionKey, fields, item }) {
  const [title, setTitle] = useState(item.name);
  const [values, setValues] = useState(() => initialValues(fields, item));
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl || '');
  const [photoStatus, setPhotoStatus] = useState({ text: '', kind: '' });
  const [saveStatus, setSaveStatus] = useState({ text: '', kind: '' });
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await apiAdmin(`/api/admin/content/${sectionKey}/${item.id}/photo`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPhotoStatus({ text: data.error || 'Upload failed.', kind: 'error' });
        return;
      }
      setPhotoUrl(`${data.item.photoUrl}?t=${Date.now()}`);
      setPhotoStatus({ text: 'Photo updated.', kind: 'ok' });
    } catch (err) {
      if (err.message !== 'Not authenticated') setPhotoStatus({ text: 'Upload failed.', kind: 'error' });
    }
  }

  async function handleSave() {
    const body = {};
    fields.forEach((field) => {
      body[field.key] = field.isCsv ? values[field.key] : field.type === 'number' ? Number(values[field.key]) : values[field.key];
    });
    setSaving(true);
    try {
      const res = await apiAdmin(`/api/admin/content/${sectionKey}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSaveStatus({ text: data.ok ? 'Saved.' : data.error || 'Save failed.', kind: data.ok ? 'ok' : 'error' });
      if (data.ok) setTitle(data.item.name);
    } catch (err) {
      if (err.message !== 'Not authenticated') setSaveStatus({ text: 'Save failed.', kind: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-card">
      <h3>{title}</h3>
      {photoUrl && (
        <div className="photo-row">
          <img src={photoUrl} alt={title} />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
          <span className={`status ${photoStatus.kind}`}>{photoStatus.text}</span>
        </div>
      )}
      <div className="field-grid">
        {fields.map((field) => (
          <div className="field-row" key={field.key}>
            <label htmlFor={`f-${sectionKey}-${item.id}-${field.key}`}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                id={`f-${sectionKey}-${item.id}-${field.key}`}
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
              />
            ) : (
              <input
                id={`f-${sectionKey}-${item.id}-${field.key}`}
                type={field.type}
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="save-row">
        <button type="button" className="btn-small" disabled={saving} onClick={handleSave}>Save Changes</button>
        <span className={`status ${saveStatus.kind}`}>{saveStatus.text}</span>
      </div>
    </div>
  );
}

export default function ListSectionPanel({ sectionKey }) {
  const config = LIST_SECTIONS[sectionKey];
  const [items, setItems] = useState(null);

  useEffect(() => {
    let active = true;
    apiAdmin(`/api/admin/content/${sectionKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((err) => {
        if (err.message !== 'Not authenticated') console.error(err);
      });
    return () => {
      active = false;
    };
  }, [sectionKey]);

  if (items === null) return <p>Loading...</p>;

  return (
    <>
      {items.map((item) => (
        <ItemEditCard key={item.id} sectionKey={sectionKey} fields={config.fields} item={item} />
      ))}
    </>
  );
}
