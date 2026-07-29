import { useEffect, useRef, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';

const TYPE_LABELS = {
  villa: 'Book a Villa',
  tour: 'Book a Tour',
  activity: 'Reserve an Activity',
  restaurant: 'Restaurant Reservation',
};

export default function BookingModal() {
  const { booking, closeBooking } = useSite();
  const formRef = useRef(null);
  const [feedback, setFeedback] = useState({ text: '', kind: '' });
  const [submitting, setSubmitting] = useState(false);

  // Reset the form + feedback each time a fresh booking flow opens, the
  // same as openModal() did in main.js.
  useEffect(() => {
    if (booking.open && formRef.current) {
      formRef.current.reset();
      const guestsField = formRef.current.querySelector('[name="guests"]');
      if (guestsField) guestsField.value = 2;
      setFeedback({ text: '', kind: '' });
    }
  }, [booking.open, booking.type, booking.itemId]);

  if (!booking.open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(formRef.current);
    const payload = {
      type: booking.type,
      itemId: booking.itemId,
      itemName: booking.itemName,
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
        <h3>{TYPE_LABELS[booking.type] || 'Book Now'}</h3>
        <p className="modal-item-name">{booking.itemName}</p>
        <form ref={formRef} className="booking-form" onSubmit={handleSubmit}>
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
