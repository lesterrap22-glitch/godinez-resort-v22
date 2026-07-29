import { useState } from 'react';
import IconTile from './IconTile.jsx';
import { useSite } from '../context/SiteContext.jsx';

// Real photo block (object-fit: cover fills the tile completely - see
// .tour-photo in styles.css) with an optional small credit caption.
// Clicking it opens the lightbox on this exact photo, in its gallery, with
// working prev/next - same behavior as the old data-gallery attributes +
// delegated click listener, just wired through context instead.
export default function PhotoTile({ photoUrl, alt, credit, fallbackTileClass, fallbackIcon, galleryName, galleryIndex, className }) {
  const { openGallery, galleries } = useSite();
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <IconTile tileClass={fallbackTileClass || 'tile-activity'} icon={fallbackIcon} label={alt} />;
  }

  const canOpen = galleryName !== undefined && (galleries[galleryName] || []).length > 0;

  return (
    <div className={`tour-photo-wrap ${fallbackTileClass || ''} ${className || ''}`}>
      <img
        className="tour-photo"
        src={photoUrl}
        alt={alt}
        loading="lazy"
        onError={() => setBroken(true)}
        onClick={canOpen ? () => openGallery(galleryName, galleryIndex) : undefined}
        style={{ cursor: canOpen ? 'pointer' : undefined }}
      />
      {credit ? <span className="photo-credit">{credit}</span> : null}
    </div>
  );
}
