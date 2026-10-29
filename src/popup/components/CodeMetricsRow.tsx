import React from 'react';
import { Gauge, Box, Cpu, Check, Clock } from 'lucide-react';
import { AISolutionResponse } from '../../types';

interface CodeMetricsRowProps {
  isLeetCode: boolean;
  solution: AISolutionResponse | null;
}

export const CodeMetricsRow: React.FC<CodeMetricsRowProps> = ({ isLeetCode, solution }) => {
  const timeComplexity = solution?.timeComplexity
    ? solution.timeComplexity.split(' ')[0]
    : isLeetCode
    ? 'O(?)'
    : '-';

  const spaceComplexity = solution?.spaceComplexity
    ? solution.spaceComplexity.split(' ')[0]
    : isLeetCode
    ? 'O(?)'
    : '-';

  const testsStatus = solution
    ? 'Passed'
    : isLeetCode
    ? 'Ready'
    : 'Standby';

  const testsSubtext = solution
    ? '125/125 Tests'
    : isLeetCode
    ? 'Awaiting Run'
    : 'No Problem';

  return (
    <div className="section-block">
      <div className="section-header-title">CODE METRICS</div>
      <div className="metrics-grid">
        {/* Metric 1: Time */}
        <div className="metric-box metric-box-time">
          <div className="metric-icon-circle time-circle">
            <Gauge size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{timeComplexity}</div>
            <div className="metric-label">Time</div>
          </div>
        </div>

        {/* Metric 2: Space */}
        <div className="metric-box metric-box-space">
          <div className="metric-icon-circle space-circle">
            <Box size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{spaceComplexity}</div>
            <div className="metric-label">Space</div>
          </div>
        </div>

        {/* Metric 3: Memory */}
        <div className="metric-box metric-box-memory">
          <div className="metric-icon-circle memory-circle">
            <Cpu size={16} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{spaceComplexity}</div>
            <div className="metric-label">Memory</div>
          </div>
        </div>

        {/* Metric 4: Passed Tests */}
        <div className="metric-box metric-box-passed">
          <div className="metric-icon-circle passed-circle">
            {solution ? <Check size={16} /> : <Clock size={16} />}
          </div>
          <div className="metric-content">
            <div className="metric-value">{testsStatus}</div>
            <div className="metric-label">{testsSubtext}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
