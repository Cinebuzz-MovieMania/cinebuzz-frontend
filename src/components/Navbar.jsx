import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <nav className="navbar">
      <Link to="/" className="brand">CineBuzz</Link>
      <Link to="/" className={isActive("/")}>Home</Link>
      <Link to="/admin/cities" className={isActive("/admin/cities")}>Cities</Link>
      <Link to="/admin/theatres" className={isActive("/admin/theatres")}>Theatres</Link>
      <Link to="/admin/screens" className={isActive("/admin/screens")}>Screens</Link>
      <Link to="/admin/movies" className={isActive("/admin/movies")}>Movies</Link>
      <Link to="/admin/persons" className={isActive("/admin/persons")}>Persons</Link>
      <Link to="/admin/showtimes" className={isActive("/admin/showtimes")}>Showtimes</Link>
    </nav>
  );
}

export default Navbar;
