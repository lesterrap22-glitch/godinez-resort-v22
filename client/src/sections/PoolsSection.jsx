import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import Reveal from '../components/Reveal.jsx';

export default function PoolsSection() {
  const { setGallery } = useSite();
  const [pools, setPools] = useState(null);

  useEffect(() => {
    fetchJSON('/api/pools')
      .then((data) => {
        setPools(data);
        setGallery('pools', buildGallery(data));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="pools" className="section alt">
      <div className="container">
        <span className="eyebrow">Cool off</span>
        <h2>Swimming Pools</h2>
        <p className="section-intro">
          Two shared pools, open to overnight and day-tour guests, with depths reaching up to 5 feet.
        </p>
        <Reveal as="div" className="card-grid">
          {pools === null && 'Loading pools...'}
          {pools &&
            pools.map((p, i) => (
              <div className="card" key={p.id}>
                <CardMedia item={p} tileClass="tile-pool" galleryName="pools" galleryIndex={i} />
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <p className="meta">Depth: {p.depth}</p>
                  <p>{p.description}</p>
                </div>
              </div>
            ))}
        </Reveal>
      </div>
    </section>
  );
}
