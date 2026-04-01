import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";

function AppShell() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="app-shell">
      {user && isAdmin() && <AdminSidebar />}
      <div className="app-main-column">
        {user && <Navbar />}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
