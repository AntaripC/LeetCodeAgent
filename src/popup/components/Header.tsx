import React from 'react';
import { Settings, BookmarkPlus, Sparkles, CheckCircle2 } from 'lucide-react';

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
        <div className="logo-badge" title="LeetCode Copilot Pro">
          <Sparkles size={15} />
        </div>
        <div className="title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1>LeetCode Copilot</h1>
            <span className="pro-badge">PRO</span>
          </div>
          <div className="status-pill">
            <span
              className={`status-dot ${isLeetCode ? (isConfigured ? 'active' : 'ready') : 'inactive'}`}
            />
            <span>
              {!isLeetCode
                ? 'Standby (Open LeetCode)'
                : isConfigured
                ? `${providerName.replace(/\(.*\)/, '').trim()} Active`
                : 'Engine Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-button"
          onClick={onOpenImport}
          title="Problem Library & Batch Imports"
        >
          <BookmarkPlus size={15} />
        </button>
        <button
          className="icon-button"
          onClick={onOpenSettings}
          title="Copilot Preferences"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
