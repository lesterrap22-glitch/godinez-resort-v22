import { useEffect, useRef, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import BookButton from '../components/BookButton.jsx';

// Curated set of real resort photos the hero slowly cycles through, each
// with its own continuous slow zoom (a "Ken Burns" effect) and a crossfade
// into the next - the closest a photo-only hero can get to the moving-
// camera feel of an actual video reel, since no real footage exists yet.
// The `full` url is what the lightbox opens to (the uncropped uploaded
// photo) if it differs from the cropped/optimized version shown here.
// `label`/`note` (when present) caption the photo bottom-left, same idea as
// the named callouts on campuestohanhighlandresort.com's photos - the note
// reuses each spot's real tagline/description from the site's own content
// rather than new marketing copy.
const SLIDES = [
  { url: 'images/hero-collage.jpg', full: 'images/hero-full.jpg', alt: 'Aerial view of Godinez Resort' },
  { url: 'images/villa-milagros.jpg', alt: 'Milagros Villa', label: 'Milagros Villa', note: 'Spacious family villa, sleeps up to 25' },
  { url: 'images/pool-main.jpg', alt: 'Main swimming pool', label: 'Main Pool', note: 'Up to 5 feet deep, for guests of all ages' },
  { url: 'images/activity-sugarcane-maze.jpg', alt: 'Sugarcane Maze activity', label: 'Sugarcane Maze', note: 'A living maze grown from Negros’ signature crop' },
  { url: 'images/restaurant.jpg', alt: 'G-Resto restaurant', label: 'G-Resto', note: 'Negrense flavors, farm-to-table freshness' },
];

const SLIDE_DURATION_MS = 6000;

export default function Hero() {
  const { openGallery, setGallery, galleries } = useSite();
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!galleries.hero) {
      setGallery(
        'hero',
        SLIDES.map((s) => ({ url: s.full || s.url, alt: s.alt, credit: '' }))
      );
    }
  }, [galleries.hero, setGallery]);

  function startTimer() {
    clearInterval(timerRef.current);
    // Respect the user's motion preference - skip the auto-cycling
    // slideshow entirely if they prefer reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
  }

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  // Jumping to a photo directly restarts the auto-cycle timer from zero, so
  // it doesn't immediately flip to the next one right after a manual pick.
  function goToSlide(i) {
    setActiveIndex(i);
    startTimer();
  }

  const activeSlide = SLIDES[activeIndex];

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
      {activeSlide.label && (
        <div className="hero-slide-caption" key={activeSlide.url}>
          <p className="hero-slide-caption-label">{activeSlide.label}</p>
          <p className="hero-slide-caption-note">{activeSlide.note}</p>
        </div>
      )}
      <div className="hero-content container">
        <h1>
          <img className="hero-logo" src="/logo.png" alt="Godinez Resort" />
        </h1>
        <p>Your home base in Bago City, Negros Occidental - with pool days, villa nights, and heritage tours around the region.</p>
        <p className="hero-facts">Built by Family, Open to Yours</p>
        <div className="hero-actions">
          <BookButton type="general" itemId="general" itemName="General Inquiry" label="Book Now" />
          <a href="#tours" className="btn btn-secondary">Explore Tours</a>
        </div>
      </div>
      <div className="hero-dots" role="tablist" aria-label="Jump to a hero photo">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.url}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={slide.label ? `Show ${slide.label} photo` : `Show photo ${i + 1}`}
            className={`hero-dot${i === activeIndex ? ' hero-dot-active' : ''}`}
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>
    </section>
  );
}
