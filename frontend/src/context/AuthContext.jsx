/**
 * PURPOSE
 * -------
 * Global auth state and actions for the entire application.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Restore user session from localStorage on mount (via /auth/me)
 * - Expose login, register, logout actions
 * - Provide isAuthenticated, loading, and error state
 *
 * NEVER
 * -----
 * - Make routing decisions
 * - Render UI
 * - Access the DOM directly
 *
 * EXPORTS
 * -------
 * AuthProvider, useAuth
 *
 * DEPENDS ON
 * ----------
 * services/auth.service
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true until session restore completes
  const [error,   setError]   = useState(null);

  // ── Session restore on mount ──────────────────────────────────────

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('mc_access');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authService.getMe();
        setUser(data.data.user);
      } catch {
        // Token invalid or expired beyond silent refresh — clear storage
        localStorage.removeItem('mc_access');
        localStorage.removeItem('mc_refresh');
        localStorage.removeItem('mc_user');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });
      localStorage.setItem('mc_access',  data.data.accessToken);
      localStorage.setItem('mc_refresh', data.data.refreshToken);
      localStorage.setItem('mc_user',    JSON.stringify(data.data.user));
      setUser(data.data.user);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await authService.register({ email, password, fullName: displayName });
      localStorage.setItem('mc_access',  data.data.accessToken);
      localStorage.setItem('mc_refresh', data.data.refreshToken);
      localStorage.setItem('mc_user',    JSON.stringify(data.data.user));
      setUser(data.data.user);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('mc_refresh');
    await authService.logout(refreshToken).catch(() => {});
    localStorage.removeItem('mc_access');
    localStorage.removeItem('mc_refresh');
    localStorage.removeItem('mc_user');
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
