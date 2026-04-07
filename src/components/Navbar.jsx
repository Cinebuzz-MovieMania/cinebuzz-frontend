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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const isActive = (path) => location.pathname === path ? "active" : "";

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await releaseCheckoutDraftHolds();
    logout();
    navigate("/");
  };

  const handleCityClick = async () => {
    await releaseCheckoutDraftHolds();
    openCityPicker();
    navigate("/");
  };

  /** CineBuzz → Now Showing; release checkout holds if leaving payment page. */
  const handleBrandHomeClick = async (e) => {
    if (location.pathname === "/booking/checkout") {
      e.preventDefault();
      await releaseCheckoutDraftHolds();
      navigate("/");
    }
  };

  const handleUserMenuNav = async (e, path) => {
    if (location.pathname === "/booking/checkout") {
      e.preventDefault();
      setUserMenuOpen(false);
      await releaseCheckoutDraftHolds();
      navigate(path);
      return;
    }
    setUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      {user ? (
        <Link to="/" className="brand" onClick={handleBrandHomeClick}>
          CineBuzz
        </Link>
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
        <div className="navbar-user-wrap" ref={userMenuRef}>
          <button
            type="button"
            className="navbar-user-toggle"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label={`${user.name}, account menu`}
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <span className="navbar-user-emoji" aria-hidden="true">
              👤
            </span>
            <span>{user.name}</span>
          </button>
          {userMenuOpen && (
            <div className="navbar-user-menu" role="menu">
              <Link
                to="/bookings"
                role="menuitem"
                className="navbar-user-menu-item navbar-user-menu-link"
                onClick={(e) => handleUserMenuNav(e, "/bookings")}
              >
                My bookings
              </Link>
              <Link
                to="/profile"
                role="menuitem"
                className="navbar-user-menu-item navbar-user-menu-link"
                onClick={(e) => handleUserMenuNav(e, "/profile")}
              >
                Edit profile
              </Link>
              <button type="button" className="navbar-user-menu-item" role="menuitem" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
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
