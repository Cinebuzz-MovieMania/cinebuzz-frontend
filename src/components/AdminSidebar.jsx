import { NavLink, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/admin/cities", label: "Cities" },
  { to: "/admin/theatres", label: "Theatres" },
  { to: "/admin/screens", label: "Screens" },
  { to: "/admin/movies", label: "Movies", prefixMatch: true },
  { to: "/admin/persons", label: "Persons" },
  { to: "/admin/showtimes", label: "Showtimes" },
];

function AdminSidebar() {
  const loc = useLocation();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">Admin</div>
      <nav className="admin-sidebar-nav">
        {LINKS.map(({ to, label, prefixMatch }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => {
              const active = prefixMatch ? loc.pathname.startsWith(to) : isActive;
              return `admin-sidebar-link${active ? " active" : ""}`;
            }}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
