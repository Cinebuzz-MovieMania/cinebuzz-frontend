import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCity } from "../context/CityContext";
import { readHomeReturnSnapshot } from "../utils/homeReturnSnapshot";
import { releaseCheckoutDraftHolds } from "../utils/releaseSeatHold";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedCity, openCityPicker } = useCity();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const brandWrapRef = useRef(null);
  const isActive = (path) => location.pathname === path ? "active" : "";

  useEffect(() => {
    if (!brandMenuOpen) return;
    const onDoc = (e) => {
      if (brandWrapRef.current && !brandWrapRef.current.contains(e.target)) {
        setBrandMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [brandMenuOpen]);

  const handleLogout = async () => {
    await releaseCheckoutDraftHolds();
    logout();
    navigate("/");
  };

  const handleCityClick = async () => {
    await releaseCheckoutDraftHolds();
    openCityPicker();
    navigate("/");
  };

  const handleNavFromCheckout = async (e, path) => {
    if (location.pathname === "/booking/checkout") {
      e.preventDefault();
      await releaseCheckoutDraftHolds();
      setBrandMenuOpen(false);
      navigate(path);
      return;
    }
    setBrandMenuOpen(false);
  };

  return (
    <nav className="navbar">
      {user ? (
        <div className="navbar-brand-wrap" ref={brandWrapRef}>
          <button
            type="button"
            className="brand brand-toggle"
            aria-expanded={brandMenuOpen}
            aria-haspopup="true"
            onClick={() => setBrandMenuOpen((o) => !o)}
          >
            CineBuzz
          </button>
          {brandMenuOpen && (
            <div className="navbar-brand-menu" role="menu">
              <Link
                to="/"
                role="menuitem"
                onClick={(e) => handleNavFromCheckout(e, "/")}
              >
                Home
              </Link>
              <Link
                to="/bookings"
                role="menuitem"
                onClick={(e) => handleNavFromCheckout(e, "/bookings")}
              >
                My bookings
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <Link to="/" className="brand">CineBuzz</Link>
          <Link to="/" className={isActive("/")}>Home</Link>
        </>
      )}
      <div className="navbar-spacer" />
      <button type="button" className="navbar-city" onClick={handleCityClick}>
        📍 {selectedCity ? selectedCity.name : "Select City"}
      </button>
      {user ? (
        <>
          <span className="navbar-user">{user.name}</span>
          <button type="button" className="navbar-logout" onClick={handleLogout}>Sign out</button>
        </>
      ) : (
        <div className="navbar-auth">
          <button
            type="button"
            className="navbar-signin"
            onClick={() =>
              navigate("/login", {
                state: { from: location, home: readHomeReturnSnapshot() },
              })
            }
          >
            Sign in
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
