import React from 'react';

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.75rem', padding: '3rem 2rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</span>
      {title && <h3 style={{ fontWeight: 600, color: 'var(--color-text)' }}>{title}</h3>}
      {description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 320 }}>{description}</p>}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}
