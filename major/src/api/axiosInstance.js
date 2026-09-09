import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://unfazed-major-project-intership-1.onrender.com/api',
});

// Attach JWT token to every request automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle errors gracefully without wiping local session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT wipe local storage or force redirect to /login on network errors or 401s.
    // Let components handle API fallbacks seamlessly.
    return Promise.reject(error);
  }
);

export default api;
