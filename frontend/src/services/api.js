/**
 * Centralized Axios instance shared by all feature services.
 * Handles auth token attachment and silent token refresh.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent refresh on 401
let isRefreshing = false;
let failedQueue  = [];
const processQueue = (err, token = null) => {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (
      error.response?.status === 401 &&
      !orig._retry &&
      localStorage.getItem('mc_refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
      }
      orig._retry   = true;
      isRefreshing  = true;
      try {
        const { data } = await api.post('/auth/refresh', {
          refreshToken: localStorage.getItem('mc_refresh'),
        });
        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('mc_access',  accessToken);
        localStorage.setItem('mc_refresh', refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        orig.headers.Authorization = `Bearer ${accessToken}`;
        return api(orig);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('mc_access');
        localStorage.removeItem('mc_refresh');
        localStorage.removeItem('mc_user');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
