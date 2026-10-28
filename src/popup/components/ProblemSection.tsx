import React from 'react';
import { ExternalLink, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProblemContext } from '../../types';

interface ProblemSectionProps {
  problem: ProblemContext | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({
  problem,
  isLoading,
  onRefresh
}) => {
  if (!problem) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <FileText size={13} />
            Detected Problem
          </span>
          <button className="icon-button" onClick={onRefresh} title="Scan current tab">
            <RefreshCw size={12} className={isLoading ? 'spinner' : ''} />
          </button>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '6px 0' }}>
          No active LeetCode problem detected. Open any problem at{' '}
          <a
            href="https://leetcode.com/problemset/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
          >
            leetcode.com/problems
          </a>
        </div>
      </div>
    );
  }

  const difficultyClass = (problem.difficulty || 'unknown').toLowerCase();

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <FileText size={13} />
          Active Problem
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="icon-button"
            onClick={onRefresh}
            title="Refresh problem context from page"
          >
            <RefreshCw size={12} className={isLoading ? 'spinner' : ''} />
          </button>
          {problem.url && (
            <a
              href={problem.url}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              title="Open problem in new tab"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <div className="problem-title-row">
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          className="problem-name"
          title={problem.title}
        >
          {problem.title}
        </a>
        <span className={`difficulty-badge ${difficultyClass}`}>
          {problem.difficulty}
        </span>
      </div>

      <div className="problem-meta">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {problem.statement && problem.statement.length > 30 ? (
            <CheckCircle2 size={12} color="var(--success-color)" />
          ) : (
            <AlertCircle size={12} color="var(--warning-color)" />
          )}
          {problem.statement && problem.statement.length > 30 ? 'Statement Loaded' : 'Partial Context'}
        </span>
        <span>•</span>
        <span>{problem.examples ? problem.examples.length : 0} Examples</span>
        <span>•</span>
        <span>{problem.constraints ? problem.constraints.length : 0} Constraints</span>
      </div>
    </div>
  );
};
