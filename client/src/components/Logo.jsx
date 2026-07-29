// The resort's real logo file (client/public/logo.png) - the same brand
// mark used on the company's other site, supplied directly by the user
// rather than redrawn, since both sites represent the same business.
export default function Logo() {
  return (
    <a href="#home" className="logo" aria-label="Godinez Resort - home">
      <img className="logo-mark" src="/logo.png" alt="Godinez Resort" />
    </a>
  );
}
