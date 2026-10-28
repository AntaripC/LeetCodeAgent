import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

export type StatusLevel = 'info' | 'success' | 'warning' | 'error';

interface StatusBannerProps {
  level: StatusLevel;
  message: string;
  loading?: boolean;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  level,
  message,
  loading = false,
  onDismiss
}) => {
  if (!message) return null;

  const renderIcon = () => {
    if (loading) return <RefreshCw size={13} className="spinner" />;
    switch (level) {
      case 'success':
        return <CheckCircle size={13} />;
      case 'warning':
        return <AlertTriangle size={13} />;
      case 'error':
        return <AlertCircle size={13} />;
      default:
        return <Info size={13} />;
    }
  };

  return (
    <div className={`status-banner ${level}`}>
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>{renderIcon()}</span>
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{message}</span>
      {onDismiss && !loading && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 4px',
            fontSize: '14px',
            lineHeight: 1
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};
