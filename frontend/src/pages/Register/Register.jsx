import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ede9ff 0%, #f0f4ff 100%)', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧠</div>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem', margin: 0 }}>MindCare AI</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Start your wellness journey</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>Create your account</h2>
          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', background: 'var(--color-error-light)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="fullName" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Full Name</label>
            <input id="fullName" type="text" name="fullName" placeholder="Your name" value={form.fullName} onChange={handleChange} required autoComplete="name" style={{ padding: '0.7rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Email</label>
            <input id="email" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required autoComplete="email" style={{ padding: '0.7rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Password <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(min 8 chars)</span></label>
            <input id="password" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={8} autoComplete="new-password" style={{ padding: '0.7rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '0.8rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, marginTop: '0.25rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
