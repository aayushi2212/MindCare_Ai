import api from './api.js';

const register = (dto) => api.post('/auth/register', dto);
const login    = (dto) => api.post('/auth/login', dto);
const logout   = (refreshToken = null) => api.post('/auth/logout', refreshToken ? { refreshToken } : {});
const refresh  = (refreshToken) => api.post('/auth/refresh', { refreshToken });
const getMe    = () => api.get('/auth/me');

const authService = { register, login, logout, refresh, getMe };
export default authService;
