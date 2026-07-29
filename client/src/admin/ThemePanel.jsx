import { useEffect, useState } from 'react';
import { apiAdmin } from './adminApi.js';

const SWATCH_COLORS = {
  forest: ['#234d35', '#d9a441'],
  ocean: ['#145c78', '#4fb3c9'],
  sunset: ['#7a3b1e', '#f0a63f'],
  orchid: ['#5c2d4d', '#e8a4c4'],
};

export default function ThemePanel() {
  const [themes, setThemes] = useState(null);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    apiAdmin('/api/admin/theme-options')
      .then((res) => res.json())
      .then((data) => {
        setThemes(data.themes);
        setCurrent(data.current);
      })
      .catch((err) => {
        if (err.message !== 'Not authenticated') console.error(err);
      });
  }, []);

  async function handlePick(themeId) {
    try {
      const res = await apiAdmin('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });
      const result = await res.json();
      if (result.ok) setCurrent(themeId);
    } catch (err) {
      if (err.message !== 'Not authenticated') console.error(err);
    }
  }

  if (!themes) return <p>Loading...</p>;

  return (
    <div className="edit-card">
      <h3>Pick a Color Theme</h3>
      <p>Preset combinations only, so every option is guaranteed to look good and stay readable.</p>
      <div className="theme-grid">
        {themes.map((t) => (
          <div
            key={t.id}
            className={`theme-option${t.id === current ? ' selected' : ''}`}
            onClick={() => handlePick(t.id)}
          >
            <div className="theme-swatches">
              {(SWATCH_COLORS[t.id] || ['#ccc', '#eee']).map((c, i) => (
                <span key={i} className="theme-swatch" style={{ background: c }} />
              ))}
            </div>
            <div>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
