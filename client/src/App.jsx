import { useEffect } from 'react';
import { fetchJSON } from './api.js';
import { SiteProvider } from './context/SiteContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import BookingModal from './components/BookingModal.jsx';
import Lightbox from './components/Lightbox.jsx';
import Hero from './sections/Hero.jsx';
import VillasSection from './sections/VillasSection.jsx';
import PoolsSection from './sections/PoolsSection.jsx';
import RestaurantSection from './sections/RestaurantSection.jsx';
import ActivitiesSection from './sections/ActivitiesSection.jsx';
import EventsPavilionSection from './sections/EventsPavilionSection.jsx';
import ResortMapSection from './sections/ResortMapSection.jsx';
import ToursSection from './sections/ToursSection.jsx';
import ContactSection from './sections/ContactSection.jsx';

// Applies whichever color theme the admin picked (Content & Settings ->
// Color Theme tab) by overriding the CSS custom properties set in
// styles.css's :root. Falls back to the built-in defaults already in the
// stylesheet if this fails for any reason - same as applyTheme() in the old
// main.js.
function useTheme() {
  useEffect(() => {
    fetchJSON('/api/theme')
      .then(({ vars }) => {
        Object.entries(vars || {}).forEach(([name, value]) => {
          document.documentElement.style.setProperty(name, value);
        });
      })
      .catch((err) => console.error(err));
  }, []);
}

function SiteContent() {
  useTheme();
  return (
    <>
      <Header />
      <Hero />
      <VillasSection />
      <PoolsSection />
      <RestaurantSection />
      <ActivitiesSection />
      <EventsPavilionSection />
      <ResortMapSection />
      <ToursSection />
      <ContactSection />
      <Footer />
      <BookingModal />
      <Lightbox />
    </>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <SiteContent />
    </SiteProvider>
  );
}
