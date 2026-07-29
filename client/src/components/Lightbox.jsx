import { useEffect, useRef, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

// Simple, focused photo lightbox: swipe (touch or trackpad) or click the
// arrows to move between photos, Escape or the close button to exit. No
// on-screen zoom controls - kept intentionally minimal per user feedback
// that a visible zoom toolbar felt awkward and unnecessary.

const SWIPE_THRESHOLD = 50;

export default function Lightbox() {
  const { lightbox, galleries, closeLightbox, showPrevPhoto, showNextPhoto } = useSite();
  const { open, galleryName, index } = lightbox;

  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const list = galleries[galleryName] || [];
  const photo = list[index];
  const hasMultiple = list.length > 1;

  // Keyboard shortcuts, only while open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNextPhoto();
      if (e.key === 'ArrowLeft') showPrevPhoto();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeLightbox, showNextPhoto, showPrevPhoto]);

  // Two-finger trackpad swipe (a mostly-horizontal wheel gesture) also moves
  // to the next/previous photo, same as swiping on a touchscreen.
  useEffect(() => {
    const stage = stageRef.current;
    if (!open || !stage) return;
    function onWheel(e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 12) {
        e.preventDefault();
        if (e.deltaX > 0) showNextPhoto();
        else showPrevPhoto();
      }
    }
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open, showNextPhoto, showPrevPhoto]);

  if (!open || !photo) return null;

  function handlePointerDown(e) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }

  function handlePointerEnd(e) {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) showNextPhoto();
      else showPrevPhoto();
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget || e.target === stageRef.current) closeLightbox();
  }

  const caption = [photo.alt, photo.credit].filter(Boolean).join(' — ');

  return (
    <div className="lightbox-overlay" onClick={handleOverlayClick}>
      <button type="button" className="modal-close lightbox-close" aria-label="Close" onClick={closeLightbox}>&times;</button>
      {hasMultiple && (
        <button type="button" className="lightbox-nav lightbox-nav-prev" aria-label="Previous photo" onClick={showPrevPhoto}>&lsaquo;</button>
      )}
      <div
        ref={stageRef}
        className={`lightbox-stage${isDragging ? ' is-dragging' : ''}`}
        onClick={handleOverlayClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <img className="lightbox-img" src={photo.url} alt={photo.alt || ''} draggable="false" />
      </div>
      {hasMultiple && (
        <button type="button" className="lightbox-nav lightbox-nav-next" aria-label="Next photo" onClick={showNextPhoto}>&rsaquo;</button>
      )}
      <p className="lightbox-caption">{caption}</p>
      {hasMultiple && <p className="lightbox-counter">{index + 1} / {list.length}</p>}
    </div>
  );
}
