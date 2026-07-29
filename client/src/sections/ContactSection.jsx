import BookButton from '../components/BookButton.jsx';

export default function ContactSection() {
  return (
    <section id="contact" className="section alt">
      <div className="container contact-wrap">
        <div>
          <span className="eyebrow">Get in touch</span>
          <h2>Plan Your Visit</h2>
          <p className="section-intro">
            Have a question, or want to book a group event? Reach out and our team will get back to you.
          </p>
          <ul className="contact-list">
            <li><strong>Location:</strong> Bacolod, Negros Occidental, Philippines</li>
            <li><strong>Phone:</strong> +63 000 000 0000</li>
            <li><strong>Email:</strong> hello@godinezresort.example</li>
          </ul>
        </div>
        <BookButton type="restaurant" itemId="general" itemName="General Reservation" label="Make a Reservation" />
      </div>
    </section>
  );
}
