import IconTile from './IconTile.jsx';
import PhotoTile from './PhotoTile.jsx';

// Picks a real photo if the item has one (item.photoUrl), otherwise falls
// back to the icon-illustration tile - this is what makes new photos show
// up automatically just by adding a photoUrl field, no code changes needed.
export default function CardMedia({ item, tileClass, galleryName, galleryIndex }) {
  if (item.photoUrl) {
    return (
      <PhotoTile
        photoUrl={item.photoUrl}
        alt={item.name}
        credit={item.photoCredit}
        fallbackTileClass={tileClass}
        fallbackIcon={item.icon}
        galleryName={galleryName}
        galleryIndex={galleryIndex}
      />
    );
  }
  return <IconTile tileClass={tileClass} icon={item.icon} label={item.name} />;
}
