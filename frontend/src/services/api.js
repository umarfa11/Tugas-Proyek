import axios from 'axios';

// Base URL mengarah ke backend yang berjalan di port 5000
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyematkan token JWT pada setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ambil token dari local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
