import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminCities from "./pages/admin/AdminCities";
import AdminTheatres from "./pages/admin/AdminTheatres";
import AdminScreens from "./pages/admin/AdminScreens";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminPersons from "./pages/admin/AdminPersons";
import AdminShowtimes from "./pages/admin/AdminShowtimes";
import BookingCheckout from "./pages/BookingCheckout";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/booking/checkout"
          element={
            <ProtectedRoute>
              <BookingCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/cities" element={<ProtectedRoute adminOnly><AdminCities /></ProtectedRoute>} />
        <Route path="/admin/theatres" element={<ProtectedRoute adminOnly><AdminTheatres /></ProtectedRoute>} />
        <Route path="/admin/screens" element={<ProtectedRoute adminOnly><AdminScreens /></ProtectedRoute>} />
        <Route path="/admin/movies" element={<ProtectedRoute adminOnly><AdminMovies /></ProtectedRoute>} />
        <Route path="/admin/persons" element={<ProtectedRoute adminOnly><AdminPersons /></ProtectedRoute>} />
        <Route path="/admin/showtimes" element={<ProtectedRoute adminOnly><AdminShowtimes /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
