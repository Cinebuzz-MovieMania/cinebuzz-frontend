import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/admin/cities", label: "Cities" },
  { to: "/admin/theatres", label: "Theatres" },
  { to: "/admin/screens", label: "Screens" },
  { to: "/admin/movies", label: "Movies" },
  { to: "/admin/persons", label: "Persons" },
  { to: "/admin/showtimes", label: "Showtimes" },
];

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">Admin</div>
      <nav className="admin-sidebar-nav">
        {LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
