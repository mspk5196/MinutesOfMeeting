import axios from 'axios';

// Determine API base URL from Vite env or window override, with sensible local default
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'https://pcdp.bitsathy.ac.in/api/';

export const apiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: Attach fresh token to every request
api.interceptors.request.use(
  (config) => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors consistently
api.interceptors.response.use(
  (response) => {
    // Successful responses pass through
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error - no response from server:', error.message);
      // You can show a toast notification here
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        originalError: error
      });
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      console.error('401 Unauthorized - Token expired or invalid');
      
      // Clear invalid token
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        delete api.defaults.headers.common['Authorization'];
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }

      // Avoid redirect loop: only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Store the current page to redirect back after login
        try {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
        } catch (e) {
          console.error('Error storing redirect path:', e);
        }
        
        // Redirect to login
        window.location.href = '/login';
      }

      return Promise.reject({
        status: 401,
        message: data?.message || 'Session expired. Please login again.',
        originalError: error
      });
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (status === 403) {
      console.error('403 Forbidden - Insufficient permissions');
      return Promise.reject({
        status: 403,
        message: data?.message || 'You do not have permission to perform this action.',
        originalError: error
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.error('404 Not Found:', error.config?.url);
      return Promise.reject({
        status: 404,
        message: data?.message || 'Resource not found.',
        originalError: error
      });
    }

    // Handle 422 Validation errors
    if (status === 422) {
      console.error('422 Validation Error:', data);
      return Promise.reject({
        status: 422,
        message: data?.message || 'Validation error.',
        errors: data?.errors,
        originalError: error
      });
    }

    // Handle 500 Server errors
    if (status >= 500) {
      console.error('Server error:', status, data);
      return Promise.reject({
        status,
        message: data?.message || 'Server error. Please try again later.',
        originalError: error
      });
    }

    // Handle other errors
    console.error('API error:', status, data);
    return Promise.reject({
      status,
      message: data?.message || 'An error occurred. Please try again.',
      originalError: error
    });
  }
);

// Carry token if present at startup (fallback for initial load)
try {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
} catch {}

export default api;
