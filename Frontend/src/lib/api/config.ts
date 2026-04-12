import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// DEBUG: Log API URL being used
console.log('FRONTEND DEBUG: API_BASE_URL =', API_BASE_URL);
console.log('FRONTEND DEBUG: VITE_API_URL env var =', import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // DEBUG: Log every API request
    console.log('FRONTEND DEBUG: API REQUEST =', config.method?.toUpperCase(), config.baseURL + config.url);
    console.log('FRONTEND DEBUG: FULL URL =', config.baseURL + config.url);
    console.log('FRONTEND DEBUG: REQUEST BODY =', config.data);
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
    // DEBUG: Log successful responses
    console.log('FRONTEND DEBUG: API RESPONSE SUCCESS =', response.status, response.config.url);
    return response;
  },
  (error) => {
    // DEBUG: Log all errors with detailed info
    console.error('FRONTEND DEBUG: API RESPONSE ERROR =', error.response?.status, error.config?.url);
    console.error('FRONTEND DEBUG: ERROR DATA =', error.response?.data);
    console.error('FRONTEND DEBUG: ERROR MESSAGE =', error.message);
    
    // Suppress logging for expected 404s from login endpoints (multi-type login flow)
    const isLoginEndpoint = error.config?.url?.includes('/login');
    const is404 = error.response?.status === 404;
    
    // Only log errors that are not expected 404s from login attempts
    if (!isLoginEndpoint || !is404) {
      console.error('API Error:', error.response?.data || error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
