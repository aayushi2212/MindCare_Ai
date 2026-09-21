import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-icon">🧠</div>
          <h1 className="auth-header-title">MindCare AI</h1>
          <p className="auth-header-subtitle">Your mental wellness companion</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-form-title">Welcome back</h2>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email" type="email" name="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email"
              className="auth-input"
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password" type="password" name="password"
              placeholder="••••••••"
              value={form.password} onChange={handleChange}
              required autoComplete="current-password"
              className="auth-input"
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="auth-submit-btn"
            style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-footer-link">Register</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
