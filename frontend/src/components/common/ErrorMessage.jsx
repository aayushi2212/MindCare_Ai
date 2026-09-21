import React from 'react';
import './common.css';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-root">
      <p className="error-text">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-retry-btn">Retry</button>
      )}
    </div>
  );
}
