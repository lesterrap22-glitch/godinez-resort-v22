import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Shared UI state for the public site: the photo galleries each section
// registers once its content loads (so the lightbox has prev/next data),
// which gallery/photo the lightbox currently has open, and the booking
// modal's open/closed state + which item it's booking. Keeping this in one
// context (rather than passing callbacks down through every section/card)
// mirrors how public/js/main.js used a handful of shared top-level
// variables (galleries, currentGalleryName, currentBooking, etc.).
const SiteContext = createContext(null);

// The hero photo is static markup (not from server/data/content/*.json like
// every other section), so its one-photo gallery is seeded here up front -
// same as galleries.hero in the old main.js. It points at the full
// uncropped aerial photo rather than the cropped desktop/mobile hero
// background, so clicking it shows the whole shot.
const INITIAL_GALLERIES = {
  hero: [{ url: 'images/hero-full.jpg', alt: 'Aerial view of Godinez Resort', credit: '' }],
};

export function SiteProvider({ children }) {
  const [galleries, setGalleries] = useState(INITIAL_GALLERIES);
  const [lightbox, setLightbox] = useState({ open: false, galleryName: null, index: 0 });
  const [booking, setBooking] = useState({ open: false, type: '', itemId: '', itemName: '' });

  const setGallery = useCallback((name, list) => {
    setGalleries((prev) => ({ ...prev, [name]: list }));
  }, []);

  const openGallery = useCallback((galleryName, index) => {
    setLightbox({ open: true, galleryName, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox((prev) => ({ ...prev, open: false }));
  }, []);

  const showPrevPhoto = useCallback(() => {
    setLightbox((prev) => {
      const list = galleries[prev.galleryName] || [];
      if (!list.length) return prev;
      return { ...prev, index: (prev.index - 1 + list.length) % list.length };
    });
  }, [galleries]);

  const showNextPhoto = useCallback(() => {
    setLightbox((prev) => {
      const list = galleries[prev.galleryName] || [];
      if (!list.length) return prev;
      return { ...prev, index: (prev.index + 1) % list.length };
    });
  }, [galleries]);

  const openBooking = useCallback((type, itemId, itemName) => {
    setBooking({ open: true, type, itemId, itemName });
  }, []);

  const closeBooking = useCallback(() => {
    setBooking((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(
    () => ({
      galleries,
      setGallery,
      lightbox,
      openGallery,
      closeLightbox,
      showPrevPhoto,
      showNextPhoto,
      booking,
      openBooking,
      closeBooking,
    }),
    [galleries, setGallery, lightbox, openGallery, closeLightbox, showPrevPhoto, showNextPhoto, booking, openBooking, closeBooking]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within a SiteProvider');
  return ctx;
}

// Derives a gallery array the same way buildGallery() did in main.js: only
// items with a photo, in order, carrying alt text + optional credit.
export function buildGallery(items) {
  return (items || [])
    .filter((item) => item.photoUrl)
    .map((item) => ({ url: item.photoUrl, alt: item.name, credit: item.photoCredit || '' }));
}
