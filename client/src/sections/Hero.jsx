import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import BookButton from '../components/BookButton.jsx';

// Curated set of real resort photos the hero slowly cycles through, each
// with its own continuous slow zoom (a "Ken Burns" effect) and a crossfade
// into the next - the closest a photo-only hero can get to the moving-
// camera feel of an actual video reel, since no real footage exists yet.
// The `full` url is what the lightbox opens to (the uncropped uploaded
// photo) if it differs from the cropped/optimized version shown here.
const SLIDES = [
  { url: 'images/hero-collage.jpg', full: 'images/hero-full.jpg', alt: 'Aerial view of Godinez Resort' },
  { url: 'images/villa-milagros.jpg', alt: 'Milagros Villa' },
  { url: 'images/pool-main.jpg', alt: 'Main swimming pool' },
  { url: 'images/activity-sugarcane-maze.jpg', alt: 'Sugarcane Maze activity' },
  { url: 'images/restaurant.jpg', alt: 'G-Resto restaurant' },
];

const SLIDE_DURATION_MS = 6000;

export default function Hero() {
  const { openGallery, setGallery, galleries } = useSite();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!galleries.hero) {
      setGallery(
        'hero',
        SLIDES.map((s) => ({ url: s.full || s.url, alt: s.alt, credit: '' }))
      );
    }
  }, [galleries.hero, setGallery]);

  useEffect(() => {
    // Respect the user's motion preference - skip the auto-cycling slideshow
    // entirely and just show the first photo if they prefer reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.url}
          src={slide.url}
          alt={slide.alt}
          className={`hero-slide tour-photo${i === activeIndex ? ' hero-slide-active' : ''}`}
          onClick={() => openGallery('hero', i)}
        />
      ))}
      <div className="hero-content container">
        <h1>
          <img className="hero-logo" src="/logo.png" alt="Godinez Resort" />
        </h1>
        <p>Your home base for pool days, villa nights, and heritage tours around Bacolod, Negros Occidental.</p>
        <p className="hero-facts">Villas from PHP 3,000/night &middot; Bacolod, Negros Occidental</p>
        <div className="hero-actions">
          <BookButton type="villa" itemId="general" itemName="Overnight Stay" label="Book a Villa" />
          <a href="#tours" className="btn btn-secondary">Explore Tours</a>
        </div>
      </div>
    </section>
  );
}
