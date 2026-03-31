import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AdminCities from "./pages/admin/AdminCities";
import AdminTheatres from "./pages/admin/AdminTheatres";
import AdminScreens from "./pages/admin/AdminScreens";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminPersons from "./pages/admin/AdminPersons";
import AdminShowtimes from "./pages/admin/AdminShowtimes";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/cities" element={<AdminCities />} />
        <Route path="/admin/theatres" element={<AdminTheatres />} />
        <Route path="/admin/screens" element={<AdminScreens />} />
        <Route path="/admin/movies" element={<AdminMovies />} />
        <Route path="/admin/persons" element={<AdminPersons />} />
        <Route path="/admin/showtimes" element={<AdminShowtimes />} />
      </Routes>
    </>
  );
}

export default App;
