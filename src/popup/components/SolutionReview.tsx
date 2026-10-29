import React, { useState } from 'react';
import { Copy, ArrowRightCircle, Check, Code, BookOpen, Clock, ShieldCheck, Download, Trash2, Zap } from 'lucide-react';
import { AISolutionResponse } from '../../types';
import { LanguageRegistry } from '../../solver/language-registry';

interface SolutionReviewProps {
  solution: AISolutionResponse;
  isInserting: boolean;
  onCopyCode: () => void;
  onInsertCode: (forceOverwrite?: boolean) => void;
  onClearSolution?: () => void;
}

export const SolutionReview: React.FC<SolutionReviewProps> = ({
  solution,
  isInserting,
  onCopyCode,
  onInsertCode,
  onClearSolution
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'thinking' | 'explanation' | 'complexity' | 'edgeCases'>('code');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      python: 'py',
      python3: 'py',
      cpp: 'cpp',
      java: 'java',
      typescript: 'ts',
      javascript: 'js',
      golang: 'go',
      rust: 'rs'
    };
    const ext = extMap[solution.language.toLowerCase()] || 'txt';
    const blob = new Blob([solution.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solution.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const displayName = LanguageRegistry.getDisplayName(solution.language);

  return (
    <div className="card solution-panel">
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
          title="View full generated code"
        >
          <Code size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Code ({displayName})
        </button>

        {solution.thinking && (
          <button
            className={`tab-btn ${activeTab === 'thinking' ? 'active' : ''}`}
            onClick={() => setActiveTab('thinking')}
            title="View fast-thinking reasoning and invariant trace"
          >
            <Zap size={12} color="#f59e0b" style={{ display: 'inline', marginRight: '4px' }} />
            Fast Thinking
          </button>
        )}

        <button
          className={`tab-btn ${activeTab === 'explanation' ? 'active' : ''}`}
          onClick={() => setActiveTab('explanation')}
          title="View algorithm, strategy & correctness proof"
        >
          <BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Algorithm & Intuition
        </button>

        <button
          className={`tab-btn ${activeTab === 'complexity' ? 'active' : ''}`}
          onClick={() => setActiveTab('complexity')}
          title="View time and space complexity analysis"
        >
          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Complexity
        </button>

        <button
          className={`tab-btn ${activeTab === 'edgeCases' ? 'active' : ''}`}
          onClick={() => setActiveTab('edgeCases')}
          title="View handled edge cases"
        >
          <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Edge Cases ({solution.edgeCases?.length || 0})
        </button>
      </div>

      {activeTab === 'code' && (
        <div className="code-container">
          <div className="code-header">
            <span>{solution.code.split('\n').length} lines</span>
            <div className="code-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCopy}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Copy code to clipboard"
              >
                {copied ? <Check size={12} color="var(--success-color)" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleDownload}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Download solution source file"
              >
                <Download size={12} />
                Save
              </button>

              <button
                className="btn btn-primary"
                onClick={() => onInsertCode(false)}
                disabled={isInserting}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Insert directly into LeetCode code editor"
              >
                <ArrowRightCircle size={12} />
                {isInserting ? 'Inserting...' : 'Insert Code'}
              </button>

              {onClearSolution && (
                <button
                  className="icon-button"
                  onClick={onClearSolution}
                  style={{ padding: '4px 6px' }}
                  title="Clear generated solution"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="code-content">{solution.code}</div>
        </div>
      )}

      {activeTab === 'thinking' && (
        <div className="review-section" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px' }}>
            <Zap size={14} color="#f59e0b" />
            <span>Fast-Thinking Intuition & Chain of Thought</span>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-line',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            {solution.thinking || 'No internal reasoning trace recorded.'}
          </div>
        </div>
      )}

      {activeTab === 'explanation' && (
        <div className="review-section" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
              Problem Summary
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{solution.problemSummary}</p>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
              Algorithm Strategy
            </div>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{solution.algorithm}</p>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
              Proof of Correctness & Invariants
            </div>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{solution.correctness}</p>
          </div>
        </div>
      )}

      {activeTab === 'complexity' && (
        <div className="review-section">
          <div className="complexity-grid">
            <div className="complexity-box">
              <span className="complexity-label">Time Complexity</span>
              <div className="complexity-value">{solution.timeComplexity}</div>
            </div>
            <div className="complexity-box">
              <span className="complexity-label">Space Complexity</span>
              <div className="complexity-value">{solution.spaceComplexity}</div>
            </div>
          </div>
          {solution.assumptions && solution.assumptions.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Assumptions & Constraints
              </div>
              <ul style={{ paddingLeft: '16px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                {solution.assumptions.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'edgeCases' && (
        <div className="review-section" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
            Handled Edge Cases
          </div>
          {solution.edgeCases && solution.edgeCases.length > 0 ? (
            <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)' }}>
              {solution.edgeCases.map((ec, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{ec}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No special edge cases identified.</p>
          )}
        </div>
      )}
    </div>
  );
};
