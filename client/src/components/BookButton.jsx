import { useSite } from '../context/SiteContext.jsx';

export default function BookButton({ type, itemId, itemName, label = 'Book Now', className = 'btn btn-primary' }) {
  const { openBooking } = useSite();
  return (
    <button type="button" className={className} onClick={() => openBooking(type, itemId, itemName)}>
      {label}
    </button>
  );
}
