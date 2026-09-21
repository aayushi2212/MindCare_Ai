import React from 'react';
import './common.css';

export default function Loading({ size = 32, text = '' }) {
  return (
    <div className="loading-root">
      <div
        className="loading-spinner"
        style={{ width: size, height: size }}
      />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
