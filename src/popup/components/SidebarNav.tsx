import React from 'react';
import { Sparkles, GitBranch, FileCode2, Settings, ChevronLeft, Bot } from 'lucide-react';

interface SidebarNavProps {
  activeView: 'copilot' | 'history' | 'library';
  onSelectView: (view: 'copilot' | 'history' | 'library') => void;
  onOpenSettings: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeView,
  onSelectView,
  onOpenSettings
}) => {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-top">
        <button
          className="sidebar-icon-btn collapse-btn"
          title="Collapse Sidebar"
          aria-label="Collapse Sidebar"
        >
          <ChevronLeft size={16} />
          <span className="sidebar-ai-tag">AI</span>
        </button>

        <button
          className={`sidebar-icon-btn ${activeView === 'copilot' ? 'active' : ''}`}
          onClick={() => onSelectView('copilot')}
          title="AI Copilot & Code Generation"
          aria-label="AI Copilot"
        >
          <div className="active-glow-pill" />
          <Sparkles size={18} />
        </button>

        <button
          className={`sidebar-icon-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => onSelectView('history')}
          title="Git Branch & Strategy History"
          aria-label="Git Branches"
        >
          <GitBranch size={17} />
        </button>

        <button
          className={`sidebar-icon-btn ${activeView === 'library' ? 'active' : ''}`}
          onClick={() => onSelectView('library')}
          title="Saved Solutions & Problem Library"
          aria-label="Problem Library"
        >
          <FileCode2 size={17} />
        </button>
      </div>

      <div className="sidebar-bottom">
        <button
          className="sidebar-icon-btn"
          onClick={onOpenSettings}
          title="Copilot Preferences & Engine Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};
