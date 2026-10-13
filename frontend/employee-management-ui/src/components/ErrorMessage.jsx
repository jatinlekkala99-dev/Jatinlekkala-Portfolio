import React from 'react';

export default function ErrorMessage({ message, onDismiss, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert-banner alert-error" role="alert">
      <div className="alert-content">
        <span className="alert-icon">⚠️</span>
        <span className="alert-message">{message}</span>
      </div>
      <div className="alert-actions">
        {onRetry && (
          <button className="btn-small btn-secondary" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button className="btn-icon" onClick={onDismiss} aria-label="Dismiss error">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
