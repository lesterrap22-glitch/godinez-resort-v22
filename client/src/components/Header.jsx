import { useState } from 'react';
import Logo from './Logo.jsx';
import BookButton from './BookButton.jsx';

const NAV_LINKS = [
  { href: '#villas', label: 'Villas' },
  { href: '#pools', label: 'Pools' },
  { href: '#restaurant', label: 'Restaurant' },
  { href: '#activities', label: 'Activities' },
  { href: '#events-pavilion', label: 'Events Pavilion' },
  { href: '#map', label: 'Resort Map' },
  { href: '#tours', label: 'Travel & Tours' },
  { href: '#contact', label: 'Contact' },
];

// Eight nav links is too many to fit in one row once the screen narrows -
// below 900px (see the .nav-toggle / .main-nav rules in styles.css) this
// collapses into a hamburger button that drops the links down as their own
// full-width panel, instead of wrapping mid-row like it used to.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav
          className={`main-nav${menuOpen ? ' main-nav-open' : ''}`}
          id="main-nav"
          aria-hidden={!menuOpen}
        >
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        {/* Book Now sits first here so the hamburger toggle lands in the
            actual right-hand corner of the header, not just left of it. */}
        <div className="nav-right">
          <BookButton type="general" itemId="general" itemName="General Inquiry" label="Book Now" className="btn btn-primary nav-cta" />
          <button
            type="button"
            className={`nav-toggle${menuOpen ? ' nav-toggle-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
