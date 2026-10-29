import React from 'react';
import { Settings, X } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onClose?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onClose }) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined' && window.close) {
      window.close();
    }
  };

  return (
    <header className="copilot-header">
      <div className="copilot-header-left">
        {/* LeetCode Copilot Logo Glyph */}
        <div className="copilot-logo-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* LeetCode stylized chevron bracket */}
            <path
              d="M16 4L7.5 11.5C7.2 11.8 7.2 12.2 7.5 12.5L16 20"
              stroke="#f59e0b"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 12H18"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="copilot-title-group">
          <h1 className="copilot-app-title">LeetCode AI Copilot</h1>
          <span className="copilot-version-pill">v1.2.0</span>
        </div>
      </div>

      <div className="copilot-header-right">
        <button
          className="header-action-text-btn"
          onClick={onOpenSettings}
          title="Open Settings & API Keys"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
        <span className="header-divider">/</span>
        <button
          className="header-action-text-btn"
          onClick={handleClose}
          title="Close Copilot"
        >
          <X size={15} />
          <span>Close</span>
        </button>
      </div>
    </header>
  );
};
