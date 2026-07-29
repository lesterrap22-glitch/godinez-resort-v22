import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import BookButton from '../components/BookButton.jsx';
import Reveal from '../components/Reveal.jsx';

export default function RestaurantSection() {
  const { setGallery } = useSite();
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    fetchJSON('/api/restaurant')
      .then((data) => {
        setRestaurant(data);
        setGallery('restaurant', buildGallery([data]));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="restaurant" className="section">
      <Reveal as="div" className="container restaurant-wrap">
        {restaurant === null && <p>Loading restaurant info...</p>}
        {restaurant && (
          <>
            <CardMedia item={restaurant} tileClass="tile-restaurant" galleryName="restaurant" galleryIndex={0} />
            <div>
              <span className="eyebrow">Dine well</span>
              <h2>{restaurant.name}</h2>
              <p className="section-intro">{restaurant.tagline}</p>
              <p className="meta">Hours: {restaurant.hours}</p>
              <ul className="restaurant-highlights">
                {restaurant.highlights.map((h, i) => (
                  <li key={i}>
                    <strong>{h.name}</strong>
                    {h.description}
                  </li>
                ))}
              </ul>
              <p className="meta">{restaurant.notes}</p>
              <BookButton type="restaurant" itemId="general" itemName={restaurant.name} label="Reserve a Table" />
            </div>
          </>
        )}
      </Reveal>
    </section>
  );
}
