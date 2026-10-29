import React, { useState } from 'react';
import { Send, Edit3, Copy, Sparkles, Loader2, Check } from 'lucide-react';
import { SolverActionType } from '../../types';

interface CopilotPromptBarProps {
  isGenerating: boolean;
  onExecutePrompt: (promptText: string, actionType: SolverActionType) => void;
  onCopyCurrentCode: () => void;
}

export const CopilotPromptBar: React.FC<CopilotPromptBarProps> = ({
  isGenerating,
  onExecutePrompt,
  onCopyCurrentCode
}) => {
  const [promptText, setPromptText] = useState('Refactor for O(1) space');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isGenerating) return;
    onExecutePrompt(promptText.trim(), 'optimize');
  };

  const handleRefactor = () => {
    onExecutePrompt(promptText.trim() || 'Refactor for O(1) space', 'optimize');
  };

  const handleUnitTests = () => {
    onExecutePrompt('Generate comprehensive unit tests and edge cases', 'explain');
  };

  const handleCopy = () => {
    onCopyCurrentCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="prompt-actions-container">
      {/* Capsule Input Bar */}
      <form className="prompt-capsule-bar" onSubmit={handleSubmit}>
        <span className="prompt-label-prefix">Ask Copilot...</span>
        <input
          type="text"
          className="prompt-text-input"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Refactor for O(1) space..."
          disabled={isGenerating}
        />
        <button
          type="submit"
          className="prompt-send-btn"
          disabled={isGenerating || !promptText.trim()}
          title="Send instruction to Copilot"
        >
          {isGenerating ? <Loader2 size={16} className="spinner" /> : <Send size={15} />}
        </button>
      </form>

      {/* Bottom Bar: Quick Icons (Left) + Action Pills (Right) */}
      <div className="bottom-actions-row">
        <div className="bottom-icon-group">
          <button
            type="button"
            className="mini-icon-tool"
            onClick={handleSubmit}
            disabled={isGenerating}
            title="Execute current prompt"
          >
            <Send size={15} />
          </button>

          <button
            type="button"
            className="mini-icon-tool"
            onClick={() => setPromptText('')}
            title="Clear prompt text"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            className="mini-icon-tool"
            onClick={handleCopy}
            title="Copy current code to clipboard"
          >
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
          </button>
        </div>

        <div className="bottom-pill-buttons">
          <button
            type="button"
            className="pill-action-btn refactor-btn"
            onClick={handleRefactor}
            disabled={isGenerating}
          >
            Refactor
          </button>

          <button
            type="button"
            className="pill-action-btn tests-btn"
            onClick={handleUnitTests}
            disabled={isGenerating}
          >
            Generate Unit Tests
          </button>
        </div>
      </div>
    </div>
  );
};
