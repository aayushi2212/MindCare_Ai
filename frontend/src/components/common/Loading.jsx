import React from 'react';

export default function Loading({ size = 32, text = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div style={{
        width: size, height: size,
        border: '3px solid var(--color-primary-light)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      {text && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{text}</p>}
    </div>
  );
}
