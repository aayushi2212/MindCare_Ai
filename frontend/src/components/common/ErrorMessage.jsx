import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      background: 'var(--color-error-light)',
      border: '1px solid #fca5a5',
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>
      <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', margin: 0 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'var(--color-error)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>Retry</button>
      )}
    </div>
  );
}
