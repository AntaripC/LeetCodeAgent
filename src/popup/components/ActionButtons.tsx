import React from 'react';
import { Sparkles, Lightbulb, Zap, Bug, RotateCcw } from 'lucide-react';
import { SolverActionType } from '../../types';

interface ActionButtonsProps {
  isGenerating: boolean;
  hasProblem: boolean;
  isConfigured: boolean;
  providerName: string;
  currentAction: SolverActionType;
  hasExistingSolution: boolean;
  onExecuteAction: (action: SolverActionType) => void;
  onOpenSettings: () => void;
  onLoadDemoProblem?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isGenerating,
  hasProblem,
  isConfigured,
  providerName,
  currentAction,
  hasExistingSolution,
  onExecuteAction,
  onOpenSettings,
  onLoadDemoProblem
}) => {
  const handleClick = (action: SolverActionType) => {
    if (isGenerating) return;

    if (!isConfigured) {
      onOpenSettings();
      return;
    }

    if (!hasProblem) {
      if (onLoadDemoProblem) {
        onLoadDemoProblem();
      }
      return;
    }

    onExecuteAction(action);
  };

  const getActionTooltip = (action: SolverActionType) => {
    if (isGenerating) return 'Currently generating solution...';
    if (!isConfigured)
      return 'Click to review AI Engine status in Preferences';
    if (!hasProblem) return 'Click to load demo problem (1. Two Sum) and solve';
    switch (action) {
      case 'solve':
        return hasExistingSolution ? 'Regenerate optimal solution' : 'Generate full verified solution';
      case 'explain':
        return 'Get algorithmic intuition, proof of correctness & invariants';
      case 'optimize':
        return 'Analyze and optimize current code for time & space efficiency';
      case 'debug':
        return 'Detect edge cases, off-by-one errors and bugs';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        className="primary-action-btn"
        disabled={isGenerating}
        onClick={() => handleClick('solve')}
        title={getActionTooltip('solve')}
        style={{
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          opacity: isGenerating ? 0.7 : 1
        }}
      >
        <Sparkles size={16} className={isGenerating && currentAction === 'solve' ? 'spinner' : ''} />
        {isGenerating && currentAction === 'solve'
          ? 'Synthesizing Solution...'
          : !isConfigured
          ? 'Initialize AI Engine'
          : !hasProblem
          ? 'Load Demo Problem & Solve'
          : hasExistingSolution
          ? 'Regenerate Optimal Solution'
          : 'Solve Problem'}
      </button>

      <div className="action-chips-row">
        <button
          className={`action-chip ${currentAction === 'explain' && isGenerating ? 'active' : ''}`}
          disabled={isGenerating}
          onClick={() => handleClick('explain')}
          title={getActionTooltip('explain')}
          style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          <Lightbulb size={12} />
          Explain Solution
        </button>

        <button
          className={`action-chip ${currentAction === 'optimize' && isGenerating ? 'active' : ''}`}
          disabled={isGenerating}
          onClick={() => handleClick('optimize')}
          title={getActionTooltip('optimize')}
          style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          <Zap size={12} />
          Optimize Code
        </button>

        <button
          className={`action-chip ${currentAction === 'debug' && isGenerating ? 'active' : ''}`}
          disabled={isGenerating}
          onClick={() => handleClick('debug')}
          title={getActionTooltip('debug')}
          style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          <Bug size={12} />
          Debug My Code
        </button>

        {hasExistingSolution && (
          <button
            className="action-chip"
            disabled={isGenerating}
            onClick={() => handleClick(currentAction)}
            title="Regenerate with fresh model perspective"
            style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
          >
            <RotateCcw size={12} />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
};
