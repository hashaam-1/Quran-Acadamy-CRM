import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://quran-acadamy-crm-backend-production.up.railway.app/api';


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to GET requests to prevent caching
    if (config.method?.toLowerCase() === 'get' && config.url?.includes('/schedules')) {
      const timestamp = new Date().getTime();
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${timestamp}`;
    }
    
        return config;
  },
  (error) => {
    console.error('FRONTEND DEBUG: REQUEST ERROR =', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
        return response;
  },
  (error) => {
    // Check if response is HTML (error page) instead of JSON
    // Only check if content-type is explicitly HTML, not if data happens to contain HTML tags
    const contentType = error.response?.headers?.['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('🔴 API Error: Server returned HTML instead of JSON. Backend may be down or misconfigured.');
      console.error('Content-Type:', contentType);
      return Promise.reject(new Error('Server returned HTML instead of JSON. Backend may be down or misconfigured.'));
    }
    
    // Only log real errors, not expected 404s from login endpoints
    const isLoginEndpoint = error.config?.url?.includes('/login');
    const is404 = error.response?.status === 404;
    
    if (!isLoginEndpoint || !is404) {
      console.error('API Error:', error.response?.status, error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

export default api;
