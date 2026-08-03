import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <main style={{ maxWidth: 500, margin: '4rem auto', padding: '2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
      <h1 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Profile</h1>
      <p><strong>Name:</strong> {user?.fullName}</p>
      <p style={{ marginTop: '0.5rem' }}><strong>Email:</strong> {user?.email}</p>
    </main>
  );
}
