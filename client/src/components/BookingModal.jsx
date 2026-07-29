import { useEffect, useRef, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

const TYPE_LABELS = {
  villa: 'Book a Villa',
  tour: 'Book a Tour',
  activity: 'Reserve an Activity',
  restaurant: 'Restaurant Reservation',
  event: 'Events Pavilion Inquiry',
};

// When a guest opens booking via the general "Book Now" button (header or
// hero) rather than a specific card, `booking.type` is the sentinel value
// 'general' and this picker lets them say what they actually want - one
// button covering villas, G-Resto, activities, and the Events Pavilion,
// instead of a button per category.
const GENERAL_CATEGORIES = [
  { value: 'villa', label: 'A Villa (Overnight Stay)' },
  { value: 'restaurant', label: 'G-Resto (Dining Reservation)' },
  { value: 'activity', label: 'An Activity' },
  { value: 'event', label: 'The Events Pavilion' },
];
const GENERAL_ITEM_NAMES = {
  villa: 'Villa Inquiry',
  restaurant: 'G-Resto Reservation',
  activity: 'Activity Inquiry',
  event: 'Events Pavilion Inquiry',
};

export default function BookingModal() {
  const { booking, closeBooking } = useSite();
  const formRef = useRef(null);
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [submitting, setSubmitting] = useState(false);
  const [generalCategory, setGeneralCategory] = useState('villa');
  const isGeneral = booking.type === 'general';

  // Reset the form + feedback each time a fresh booking flow opens, the
  // same as openModal() did in main.js.
  useEffect(() => {
    if (booking.open && formRef.current) {
      formRef.current.reset();
      const guestsField = formRef.current.querySelector('[name="guests"]');
      if (guestsField) guestsField.value = 2;
      setFeedback({ text: '', kind: '' });
      setGeneralCategory('villa');
    }
  }, [booking.open, booking.type, booking.itemId]);

  if (!booking.open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(formRef.current);
    const payload = {
      type: isGeneral ? generalCategory : booking.type,
      itemId: booking.itemId,
      itemName: isGeneral ? GENERAL_ITEM_NAMES[generalCategory] : booking.itemName,
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      date: data.get('date'),
      guests: Number(data.get('guests')),
      notes: data.get('notes') || '',
    };

    setSubmitting(true);
    setFeedback({ text: 'Submitting...', kind: '' });

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        setFeedback({ text: 'Request sent! We will contact you to confirm.', kind: 'success' });
        formRef.current.reset();
        setTimeout(closeBooking, 1800);
      } else {
        setFeedback({ text: (result.errors && result.errors[0]) || 'Something went wrong. Please try again.', kind: 'error' });
      }
    } catch {
      setFeedback({ text: 'Network error. Please try again.', kind: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) closeBooking();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button type="button" className="modal-close" aria-label="Close" onClick={closeBooking}>&times;</button>
        <h3>{isGeneral ? 'Book Now' : TYPE_LABELS[booking.type] || 'Book Now'}</h3>
        <p className="modal-item-name">{isGeneral ? GENERAL_ITEM_NAMES[generalCategory] : booking.itemName}</p>
        <form ref={formRef} className="booking-form" onSubmit={handleSubmit}>
          {isGeneral && (
            <label>What would you like to book?
              <select value={generalCategory} onChange={(e) => setGeneralCategory(e.target.value)}>
                {GENERAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          )}
          <label>Full name
            <input type="text" name="name" required maxLength={150} />
          </label>
          <label>Email
            <input type="email" name="email" required maxLength={200} />
          </label>
          <label>Phone number
            <input type="tel" name="phone" required maxLength={30} placeholder="09XXXXXXXXX" />
          </label>
          <label>Preferred date
            <input type="date" name="date" required />
          </label>
          <label>Number of guests
            <input type="number" name="guests" min="1" max="50" required defaultValue={2} />
          </label>
          <label>Notes (optional)
            <textarea name="notes" maxLength={1000} rows={3} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>Submit Request</button>
          <p className={`booking-feedback ${feedback.kind}`} role="status">{feedback.text}</p>
        </form>
      </div>
    </div>
  );
}
