import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminCities from "./pages/admin/AdminCities";
import AdminTheatres from "./pages/admin/AdminTheatres";
import AdminScreens from "./pages/admin/AdminScreens";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminPersons from "./pages/admin/AdminPersons";
import AdminShowtimes from "./pages/admin/AdminShowtimes";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/admin/cities" element={<ProtectedRoute adminOnly><AdminCities /></ProtectedRoute>} />
          <Route path="/admin/theatres" element={<ProtectedRoute adminOnly><AdminTheatres /></ProtectedRoute>} />
          <Route path="/admin/screens" element={<ProtectedRoute adminOnly><AdminScreens /></ProtectedRoute>} />
          <Route path="/admin/movies" element={<ProtectedRoute adminOnly><AdminMovies /></ProtectedRoute>} />
          <Route path="/admin/persons" element={<ProtectedRoute adminOnly><AdminPersons /></ProtectedRoute>} />
          <Route path="/admin/showtimes" element={<ProtectedRoute adminOnly><AdminShowtimes /></ProtectedRoute>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
