import axios from "axios";

const client = axios.create();

client.interceptors.request.use((config) => {
  // Resolve base URL dynamically on every request to pick up Vite hot-reloaded env changes immediately
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").trim();
  const API_BASE_URL = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE.replace(/\/$/, "")}/api/v1`;
  
  config.baseURL = API_BASE_URL;

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;
