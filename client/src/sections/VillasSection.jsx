import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import BookButton from '../components/BookButton.jsx';
import Reveal from '../components/Reveal.jsx';

export default function VillasSection() {
  const { setGallery } = useSite();
  const [villas, setVillas] = useState(null);

  useEffect(() => {
    fetchJSON('/api/villas')
      .then((data) => {
        setVillas(data);
        setGallery('villas', buildGallery(data));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="villas" className="section">
      <div className="container">
        <span className="eyebrow">Stay with us</span>
        <h2>Overnight Villas</h2>
        <p className="section-intro">
          Six villas to choose from, with Milagros and Zacarias as our two biggest. Perfect for a relaxed overnight
          stay with family or friends.
        </p>
        <Reveal as="div" className="card-grid">
          {villas === null && 'Loading villas...'}
          {villas &&
            villas.map((v, i) => (
              <div className="card" key={v.id}>
                <CardMedia item={v} tileClass="tile-villa" galleryName="villas" galleryIndex={i} />
                <div className="card-body">
                  <h3>{v.name}</h3>
                  <p className="meta">Sleeps up to {v.capacity} guests · {v.bedrooms} bedroom(s)</p>
                  <p>{v.description}</p>
                  <ul className="amenities">
                    {v.amenities.map((a, idx) => <li key={idx}>{a}</li>)}
                  </ul>
                  <p className="meta">{v.priceNote}</p>
                  <BookButton type="villa" itemId={v.id} itemName={v.name} label="Book This Villa" />
                </div>
              </div>
            ))}
        </Reveal>
      </div>
    </section>
  );
}
