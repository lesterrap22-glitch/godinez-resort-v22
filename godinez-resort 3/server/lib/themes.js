// Preset color themes the admin can pick from (no free-form color picker -
// keeps every combination guaranteed to look good/readable, per the "simple
// admin panel" scope). Each maps directly onto the CSS custom properties
// defined in :root at the top of public/css/style.css.
const THEMES = {
  forest: {
    label: 'Forest Green (default)',
    vars: {
      '--color-forest': '#234d35',
      '--color-forest-dark': '#163524',
      '--color-gold': '#d9a441',
      '--color-gold-dark': '#b8842c',
      '--color-sand': '#faf6ee',
    },
  },
  ocean: {
    label: 'Ocean Blue',
    vars: {
      '--color-forest': '#145c78',
      '--color-forest-dark': '#0d3f52',
      '--color-gold': '#4fb3c9',
      '--color-gold-dark': '#2f8ba0',
      '--color-sand': '#f2f8fa',
    },
  },
  sunset: {
    label: 'Sunset Gold',
    vars: {
      '--color-forest': '#7a3b1e',
      '--color-forest-dark': '#552911',
      '--color-gold': '#f0a63f',
      '--color-gold-dark': '#c67e1f',
      '--color-sand': '#fdf3e7',
    },
  },
  orchid: {
    label: 'Orchid Blush',
    vars: {
      '--color-forest': '#5c2d4d',
      '--color-forest-dark': '#3d1d33',
      '--color-gold': '#e8a4c4',
      '--color-gold-dark': '#c97ba1',
      '--color-sand': '#fdf2f6',
    },
  },
};

function list() {
  return Object.entries(THEMES).map(([id, t]) => ({ id, label: t.label }));
}

function getVars(themeId) {
  const theme = THEMES[themeId] || THEMES.forest;
  return theme.vars;
}

function isValidThemeId(themeId) {
  return Object.prototype.hasOwnProperty.call(THEMES, themeId);
}

module.exports = { list, getVars, isValidThemeId };
