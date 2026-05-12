import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (superAdminOnly && !isSuperAdmin()) {
    return <div className="loading">Access denied. Super admin only.</div>;
  }

  if (adminOnly && !isAdmin()) {
    return <div className="loading">Access denied. Admin only.</div>;
  }

  return children;
}

export default ProtectedRoute;
