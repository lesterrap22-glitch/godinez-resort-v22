import { useEffect, useState } from 'react';
import { fetchJSON } from '../api.js';
import { buildGallery, useSite } from '../context/SiteContext.jsx';
import CardMedia from '../components/CardMedia.jsx';
import BookButton from '../components/BookButton.jsx';
import Reveal from '../components/Reveal.jsx';

export default function ActivitiesSection() {
  const { setGallery } = useSite();
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    fetchJSON('/api/activities')
      .then((data) => {
        setActivities(data);
        setGallery('activities', buildGallery(data));
      })
      .catch((err) => console.error(err));
  }, [setGallery]);

  return (
    <section id="activities" className="section alt">
      <div className="container">
        <span className="eyebrow">Things to do</span>
        <h2>Activities</h2>
        <p className="section-intro">Hands-on, only-in-Negros experiences for guests of all ages.</p>
        <Reveal as="div" className="card-grid">
          {activities === null && 'Loading activities...'}
          {activities &&
            activities.map((a, i) => (
              <div className="card" key={a.id}>
                <CardMedia item={a} tileClass="tile-activity" galleryName="activities" galleryIndex={i} />
                <div className="card-body">
                  <span className="badge">Effort: {a.effort}</span>
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                  <p className="why">{a.whyItWorks}</p>
                  <BookButton type="activity" itemId={a.id} itemName={a.name} label="Reserve This Activity" />
                </div>
              </div>
            ))}
        </Reveal>
      </div>
    </section>
  );
}
