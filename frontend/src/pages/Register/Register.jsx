/**
 * PURPOSE
 * -------
 * Registration page. Accepts fullName, email, password,
 * delegates to AuthContext.register, then navigates to /chat on success.
 *
 * FIXES (v1.0.1)
 * --------------
 * - Corrected form.displayName → form.fullName in the fullName input binding
 *
 * NEVER
 * -----
 * - Call authService directly
 * - Store tokens
 *
 * DEPENDS ON
 * ----------
 * context/AuthContext, react-router-dom
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate              = useNavigate();

  const [form,  setForm]  = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.email, form.password, form.fullName);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--color-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h2 style={{ fontWeight: 700 }}>Create your account</h2>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', margin: 0 }}>
            {error}
          </p>
        )}

        {/* BUG FIX: was value={form.displayName} — fullName is the correct field */}
        <input
          type="text"
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={handleChange}
          required
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
        </p>
      </form>
    </main>
  );
}
