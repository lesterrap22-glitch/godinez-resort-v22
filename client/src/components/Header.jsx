import Logo from './Logo.jsx';
import BookButton from './BookButton.jsx';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="main-nav">
          <a href="#villas">Villas</a>
          <a href="#pools">Pools</a>
          <a href="#restaurant">Restaurant</a>
          <a href="#activities">Activities</a>
          <a href="#events-pavilion">Events Pavilion</a>
          <a href="#map">Resort Map</a>
          <a href="#tours">Travel &amp; Tours</a>
          <a href="#contact">Contact</a>
        </nav>
        <BookButton type="general" itemId="general" itemName="General Inquiry" label="Book Now" className="btn btn-primary nav-cta" />
      </div>
    </header>
  );
}
