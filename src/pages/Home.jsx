import { useEffect, useState } from "react";
import API from "../services/api";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/movies")
      .then((res) => {
        setMovies(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching movies", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading movies...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Now Showing</h1>
      </div>
      {movies.length === 0 ? (
        <div className="empty">No movies available yet.</div>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="poster">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "🎬"
                )}
              </div>
              <div className="info">
                <h3>{movie.title}</h3>
                <p>{movie.genre} &middot; {movie.language}</p>
                <p>{movie.durationMinutes} min</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
