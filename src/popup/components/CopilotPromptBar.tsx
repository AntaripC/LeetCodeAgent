import React, { useState } from 'react';
import { Send, Edit3, Copy, Sparkles, Loader2, Check } from 'lucide-react';
import { SolverActionType } from '../../types';

interface CopilotPromptBarProps {
  isGenerating: boolean;
  hasProblem: boolean;
  onGenerateCode: () => void;
  onExecutePrompt: (promptText: string, actionType: SolverActionType) => void;
  onCopyCurrentCode: () => void;
}

export const CopilotPromptBar: React.FC<CopilotPromptBarProps> = ({
  isGenerating,
  hasProblem,
  onGenerateCode,
  onExecutePrompt,
  onCopyCurrentCode
}) => {
  // Chatbox input is empty by default
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isGenerating) return;
    onExecutePrompt(promptText.trim(), 'optimize');
  };

  const handleRefactor = () => {
    onExecutePrompt(promptText.trim() || 'Refactor for O(1) space and optimal time complexity', 'optimize');
  };

  const handleUnitTests = () => {
    onExecutePrompt('Generate comprehensive unit tests and boundary edge cases', 'explain');
  };

  const handleCopy = () => {
    onCopyCurrentCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="prompt-actions-container">
      {/* Capsule Input Bar (Empty by default) */}
      <form className="prompt-capsule-bar" onSubmit={handleSubmit}>
        <span className="prompt-label-prefix">Ask Copilot...</span>
        <input
          type="text"
          className="prompt-text-input"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Refactor for O(1) space, explain complexity, etc."
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

      {/* Bottom Bar: Tool Icons (Left) + Action Pills (Right) */}
      <div className="bottom-actions-row">
        <div className="bottom-icon-group">
          <button
            type="button"
            className="mini-icon-tool"
            onClick={handleSubmit}
            disabled={isGenerating || !promptText.trim()}
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
          {/* Primary Generate Code Action: Analyzes question & automatically solves it */}
          <button
            type="button"
            className="pill-action-btn generate-btn"
            onClick={onGenerateCode}
            disabled={isGenerating}
            title="Analyze active LeetCode question and generate optimal solution"
          >
            {isGenerating ? <Loader2 size={13} className="spinner" /> : <Sparkles size={13} />}
            <span>Generate Code</span>
          </button>

          <button
            type="button"
            className="pill-action-btn refactor-btn"
            onClick={handleRefactor}
            disabled={isGenerating}
            title="Refactor existing code for optimality"
          >
            Refactor
          </button>

          <button
            type="button"
            className="pill-action-btn tests-btn"
            onClick={handleUnitTests}
            disabled={isGenerating}
            title="Generate edge cases and unit tests"
          >
            Generate Unit Tests
          </button>
        </div>
      </div>
    </div>
  );
};
