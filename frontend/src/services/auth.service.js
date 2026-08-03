/**
 * PURPOSE
 * -------
 * Axios instance and all HTTP calls for the auth module.
 * The AuthContext delegates every API call to this service.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Create a configured Axios instance (base URL, credentials, interceptors)
 * - Expose register, login, logout, refresh, getMe calls
 * - Attach the access token from localStorage on every request
 * - Handle token refresh on 401 (silent token rotation)
 *
 * NEVER
 * -----
 * - Manage React state
 * - Navigate programmatically
 * - Be imported from anything other than context or hooks
 *
 * DEPENDS ON
 * ----------
 * axios
 */

import axios from 'axios';

// ── Axios instance ────────────────────────────────────────────────

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('mc_refresh')
    ) {
      if (isRefreshing) {
        // Queue subsequent 401s until the refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing            = true;

      try {
        const rawRefresh = localStorage.getItem('mc_refresh');
        const { data }   = await api.post('/auth/refresh', { refreshToken: rawRefresh });

        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('mc_access',  accessToken);
        localStorage.setItem('mc_refresh', refreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear everything so AuthContext logs out
        localStorage.removeItem('mc_access');
        localStorage.removeItem('mc_refresh');
        localStorage.removeItem('mc_user');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API calls ─────────────────────────────────────────────────

/**
 * @param {{ fullName: string, email: string, password: string }} dto
 */
const register = (dto) => api.post('/auth/register', dto);

/**
 * @param {{ email: string, password: string }} dto
 */
const login = (dto) => api.post('/auth/login', dto);

/**
 * Logout current device. Pass refreshToken to revoke just this session,
 * or omit to revoke all sessions.
 * @param {string|null} refreshToken
 */
const logout = (refreshToken = null) =>
  api.post('/auth/logout', refreshToken ? { refreshToken } : {});

/**
 * Exchange a refresh token for a new token pair.
 * @param {string} refreshToken
 */
const refresh = (refreshToken) => api.post('/auth/refresh', { refreshToken });

/** Get the currently authenticated user's profile. */
const getMe = () => api.get('/auth/me');

const authService = { register, login, logout, refresh, getMe };

export default authService;
