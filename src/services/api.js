import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8010/cinebuzz/api/v1/admin",
});

export default API;
