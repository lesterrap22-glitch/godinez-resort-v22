import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import BookButton from '../components/BookButton.jsx';
import Reveal from '../components/Reveal.jsx';

export default function ToursSection() {
  const { setGallery } = useSite();
  const [tours, setTours] = useState(null);

  useEffect(() => {
    fetchJSON('/api/tours')
      .then((data) => {
        setTours(data);
        setGallery('tours', buildGallery(data));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="tours" className="section">
      <div className="container">
        <span className="eyebrow">Explore Bacolod</span>
        <h2>Travel &amp; Tours</h2>
        <p className="section-intro">
          We organize guided tours around Bacolod and nearby cities, including the region&apos;s best-known heritage
          spots.
        </p>
        <Reveal as="div" className="card-grid">
          {tours === null && 'Loading tours...'}
          {tours &&
            tours.map((t, i) => (
              <div className="card" key={t.id}>
                <CardMedia item={t} tileClass="tile-activity" galleryName="tours" galleryIndex={i} />
                <div className="card-body">
                  <span className="badge">{t.city}</span>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  <BookButton type="tour" itemId={t.id} itemName={t.name} label="Book This Tour" />
                </div>
              </div>
            ))}
        </Reveal>
      </div>
    </section>
  );
}
