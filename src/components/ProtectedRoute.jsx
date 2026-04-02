import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (adminOnly && user.role !== "ROLE_ADMIN") {
    return <div className="loading">Access denied. Admin only.</div>;
  }

  return children;
}

export default ProtectedRoute;
