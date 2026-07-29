import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import BookButton from '../components/BookButton.jsx';
import Reveal from '../components/Reveal.jsx';

// Same layout pattern as RestaurantSection (single-venue content, not a
// list), just for the resort's events venue instead of G-Resto - see
// server/data/content/events-pavilion.json for the real copy.
export default function EventsPavilionSection() {
  const { setGallery } = useSite();
  const [pavilion, setPavilion] = useState(null);

  useEffect(() => {
    fetchJSON('/api/events-pavilion')
      .then((data) => {
        setPavilion(data);
        setGallery('events-pavilion', buildGallery([data]));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="events-pavilion" className="section alt">
      <Reveal as="div" className="container restaurant-wrap">
        {pavilion === null && <p>Loading Events Pavilion info...</p>}
        {pavilion && (
          <>
            <CardMedia item={pavilion} tileClass="tile-events" galleryName="events-pavilion" galleryIndex={0} />
            <div>
              <span className="eyebrow">Celebrate with us</span>
              <h2>{pavilion.name}</h2>
              <p className="section-intro">{pavilion.tagline}</p>
              <p>{pavilion.description}</p>
              <p className="meta">Capacity: {pavilion.capacity}</p>
              <ul className="restaurant-highlights">
                {pavilion.highlights.map((h, i) => (
                  <li key={i}>
                    <strong>{h.name}</strong>
                    {h.description}
                  </li>
                ))}
              </ul>
              <p className="meta">{pavilion.notes}</p>
              <BookButton type="event" itemId="general" itemName="Events Pavilion Inquiry" label="Inquire About the Pavilion" />
            </div>
          </>
        )}
      </Reveal>
    </section>
  );
}
