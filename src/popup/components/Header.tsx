import React from 'react';
import { Settings, ListPlus, Terminal } from 'lucide-react';

interface HeaderProps {
  isLeetCode: boolean;
  providerName: string;
  isConfigured: boolean;
  onOpenSettings: () => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLeetCode,
  providerName,
  isConfigured,
  onOpenSettings,
  onOpenImport
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-badge" title="LeetCode AI Copilot">
          <Terminal size={16} />
        </div>
        <div className="title-area">
          <h1>LeetCode Copilot</h1>
          <div className="status-pill">
            <span
              className={`status-dot ${isLeetCode ? (isConfigured ? 'active' : 'warning') : 'inactive'}`}
            />
            <span>
              {!isLeetCode
                ? 'Not on LeetCode'
                : isConfigured
                ? `${providerName} Ready`
                : providerName.includes('CodeMind')
                ? 'CodeMind Offline'
                : `${providerName} Key Needed`}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-button"
          onClick={onOpenImport}
          title="Import Problem List (JSON/CSV)"
        >
          <ListPlus size={15} />
        </button>
        <button
          className="icon-button"
          onClick={onOpenSettings}
          title="Settings & API Keys"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
