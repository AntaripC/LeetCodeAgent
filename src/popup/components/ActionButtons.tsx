import React from 'react';
import { Sparkles, Lightbulb, Zap, Bug, RotateCcw } from 'lucide-react';
import { SolverActionType } from '../../types';

interface ActionButtonsProps {
  isGenerating: boolean;
  disabled: boolean;
  currentAction: SolverActionType;
  hasExistingSolution: boolean;
  onExecuteAction: (action: SolverActionType) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isGenerating,
  disabled,
  currentAction,
  hasExistingSolution,
  onExecuteAction
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        className="primary-action-btn"
        disabled={disabled || isGenerating}
        onClick={() => onExecuteAction('solve')}
      >
        <Sparkles size={16} className={isGenerating && currentAction === 'solve' ? 'spinner' : ''} />
        {isGenerating && currentAction === 'solve'
          ? 'Solving with AI...'
          : hasExistingSolution
          ? 'Regenerate Optimal Solution'
          : 'Solve with AI'}
      </button>

      <div className="action-chips-row">
        <button
          className={`action-chip ${currentAction === 'explain' && isGenerating ? 'active' : ''}`}
          disabled={disabled || isGenerating}
          onClick={() => onExecuteAction('explain')}
          title="Get algorithm intuition and conceptual walkthrough"
        >
          <Lightbulb size={12} />
          Explain Solution
        </button>

        <button
          className={`action-chip ${currentAction === 'optimize' && isGenerating ? 'active' : ''}`}
          disabled={disabled || isGenerating}
          onClick={() => onExecuteAction('optimize')}
          title="Optimize current code for time & space efficiency"
        >
          <Zap size={12} />
          Optimize Code
        </button>

        <button
          className={`action-chip ${currentAction === 'debug' && isGenerating ? 'active' : ''}`}
          disabled={disabled || isGenerating}
          onClick={() => onExecuteAction('debug')}
          title="Find bugs, off-by-one errors and edge cases"
        >
          <Bug size={12} />
          Debug My Code
        </button>

        {hasExistingSolution && (
          <button
            className="action-chip"
            disabled={disabled || isGenerating}
            onClick={() => onExecuteAction(currentAction)}
            title="Regenerate with fresh model perspective"
          >
            <RotateCcw size={12} />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
};
