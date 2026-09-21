import React from 'react';
import './common.css';

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-root">
      <span className="empty-icon">{icon}</span>
      {title       && <h3 className="empty-title">{title}</h3>}
      {description && <p  className="empty-description">{description}</p>}
      {action      && <div className="empty-action">{action}</div>}
    </div>
  );
}
