import axios from 'axios';
import { useAuthStore } from './store';

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  // If URL doesn't have a protocol and isn't a relative path (starting with /),
  // prepend https:// so it's treated as an absolute URL by the browser.
  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return `https://${url}`;
  }
  return url;
};

const API_URL = getApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and organizationId to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const user = useAuthStore.getState().user;
    if (user?.organizationId) {
      config.headers['x-tenant-id'] = user.organizationId;
    }
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 Unauthorized detected. Attempting token refresh...');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.warn('No refresh token found. Redirecting to login.');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        console.log('Token refreshed successfully.');
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.response?.data?.message || refreshError.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
