import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8010/cinebuzz";

const API = axios.create({
  baseURL: `${BASE}/api/v1/admin`,
});

export const PublicAPI = axios.create({
  baseURL: `${BASE}/api/v1`,
});

export const AuthAPI = axios.create({
  baseURL: `${BASE}/api/v1/auth`,
});

function attachToken(config) {
  const stored = localStorage.getItem("cinebuzz_user");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
}

function onUnauthorized(err) {
  if (err.response?.status === 401) {
    localStorage.removeItem("cinebuzz_user");
    window.location.href = "/";
  }
  return Promise.reject(err);
}

API.interceptors.request.use(attachToken);
PublicAPI.interceptors.request.use(attachToken);

API.interceptors.response.use((res) => res, onUnauthorized);
PublicAPI.interceptors.response.use((res) => res, onUnauthorized);

export default API;
