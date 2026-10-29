import React, { useState } from 'react';
import { Copy, Check, ArrowRightCircle, Zap } from 'lucide-react';
import { AISolutionResponse } from '../../types';

interface SuggestedCodeViewProps {
  solution: AISolutionResponse | null;
  defaultCode?: string;
  isInserting: boolean;
  onCopyCode: () => void;
  onInsertCode: () => void;
}

const DEFAULT_SAMPLE_CODE = `def maxPathSum(root):

    # Helper function to find max gain
    def maxPathSum(root):
        root = maxPathSum(root, gain)
        path = maxPathSum(root, sum)
        return root + root
    sum = max(calculateMax(path(max, gain))
    return maxPathSum(root)`;

export const SuggestedCodeView: React.FC<SuggestedCodeViewProps> = ({
  solution,
  defaultCode,
  isInserting,
  onCopyCode,
  onInsertCode
}) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const displayCode = solution?.code || defaultCode || DEFAULT_SAMPLE_CODE;
  const lines = displayCode.split('\n');

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for highlighting keywords, comments, and functions
  const renderHighlightedLine = (line: string, index: number) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return (
        <span key={index} className="syntax-comment">
          {line}
        </span>
      );
    }

    // Tokenizer regex for common python/c++/js tokens
    const tokens = line.split(/(\b(?:def|return|class|if|else|elif|for|while|in|const|let|var|function)\b|#.*$|\b(?:maxPathSum|calculateMax|max|twoSum|solve)\b|[(),:=+*-[\]{}])/g);

    return (
      <span key={index}>
        {tokens.map((token, tIdx) => {
          if (!token) return null;
          if (/^(def|return|class|if|else|elif|for|while|in|const|let|var|function)$/.test(token)) {
            return (
              <span key={tIdx} className="syntax-keyword">
                {token}
              </span>
            );
          }
          if (/^(maxPathSum|calculateMax|max|twoSum|solve)$/.test(token)) {
            return (
              <span key={tIdx} className="syntax-fn">
                {token}
              </span>
            );
          }
          if (/^[(),:=+*-[\]{}]$/.test(token)) {
            return (
              <span key={tIdx} className="syntax-punct">
                {token}
              </span>
            );
          }
          if (token.startsWith('#')) {
            return (
              <span key={tIdx} className="syntax-comment">
                {token}
              </span>
            );
          }
          return (
            <span key={tIdx} className="syntax-ident">
              {token}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="section-block">
      <div className="suggested-code-header">
        <span className="section-header-title">SUGGESTED CODE</span>
        <div className="code-corner-actions">
          {solution?.thinking && (
            <button
              className={`mini-pill-btn ${showThinking ? 'active' : ''}`}
              onClick={() => setShowThinking(!showThinking)}
              title="Toggle Fast Thinking Trace"
            >
              <Zap size={11} color="#f59e0b" />
              <span>{showThinking ? 'Hide Thinking' : 'Thinking'}</span>
            </button>
          )}

          <button className="mini-pill-btn" onClick={handleCopy} title="Copy code to clipboard">
            {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className="mini-pill-btn insert-pill"
            onClick={onInsertCode}
            disabled={isInserting}
            title="Inject directly into LeetCode Monaco editor"
          >
            <ArrowRightCircle size={11} />
            <span>{isInserting ? 'Inserting...' : 'Insert'}</span>
          </button>
        </div>
      </div>

      {showThinking && solution?.thinking ? (
        <div className="code-thinking-panel">
          <div className="thinking-title">
            <Zap size={13} color="#f59e0b" />
            <span>Fast-Thinking Deductions & Invariants</span>
          </div>
          <p className="thinking-text">{solution.thinking}</p>
        </div>
      ) : (
        <div className="code-box-container">
          <pre className="code-block-content">
            {lines.map((line, idx) => (
              <div key={idx} className="code-line-row">
                <span className="line-num">{idx + 1}</span>
                <span className="line-text">{renderHighlightedLine(line, idx)}</span>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
};
