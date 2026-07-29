// Gradient + emoji stand-in tile, used whenever an item has no photoUrl yet.
// Add a photoUrl to the item in server/data/content/*.json (or upload one
// via the admin dashboard) and PhotoTile below takes over automatically.
export default function IconTile({ tileClass, icon, label }) {
  return (
    <div className={`icon-tile ${tileClass}`}>
      <span className="icon-tile-glyph" role="img" aria-label={label || ''}>
        {icon || '\u{1F3E1}'}
      </span>
    </div>
  );
}
