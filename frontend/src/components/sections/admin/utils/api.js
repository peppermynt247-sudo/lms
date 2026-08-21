import axios from 'axios';

const api = axios.create({
   baseURL: process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'https://atomslmsapi.abc.courses/atoms', // Uncomment and set if needed
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or use cookies if SSR
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
