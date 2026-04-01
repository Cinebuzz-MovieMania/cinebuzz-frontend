import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCity } from "../context/CityContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedCity, openCityPicker } = useCity();
  const isActive = (path) => location.pathname === path ? "active" : "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCityClick = () => {
    openCityPicker();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">CineBuzz</Link>
      <Link to="/" className={isActive("/")}>Home</Link>
      <div className="navbar-spacer" />
      <button className="navbar-city" onClick={handleCityClick}>
        📍 {selectedCity ? selectedCity.name : "Select City"}
      </button>
      <span className="navbar-user">{user?.name}</span>
      <button className="navbar-logout" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;
