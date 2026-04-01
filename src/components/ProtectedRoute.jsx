import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== "ROLE_ADMIN") {
    return <div className="loading">Access denied. Admin only.</div>;
  }

  return children;
}

export default ProtectedRoute;
