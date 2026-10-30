import React, { useState, useEffect } from 'react';
import { X, Clock, Copy, Check, RotateCcw, GitBranch, Code2 } from 'lucide-react';
import { ExtensionStorage } from '../../storage/extension-storage';
import { AISolutionResponse } from '../../types';

interface HistoryModalProps {
  onClose: () => void;
  onRestoreSolution: (solution: AISolutionResponse) => void;
}

interface CachedSolutionEntry {
  slug: string;
  solution: AISolutionResponse;
  timestamp?: number;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onRestoreSolution }) => {
  const [history, setHistory] = useState<CachedSolutionEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CachedSolutionEntry | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      // In chrome.storage, look for all cached solutions
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(null, (items) => {
          const list: CachedSolutionEntry[] = [];
          Object.keys(items).forEach((key) => {
            if (key.startsWith('leetcode_copilot_solution_')) {
              const slug = key.replace('leetcode_copilot_solution_', '');
              const solution = items[key] as AISolutionResponse;
              if (solution && solution.code) {
                list.push({ slug, solution, timestamp: Date.now() });
              }
            }
          });
          setHistory(list);
          if (list.length > 0) setSelectedEntry(list[0]);
        });
      } else {
        // Fallback for standalone/dev
        const demoEntry: CachedSolutionEntry = {
          slug: 'binary-tree-maximum-path-sum',
          solution: {
            thinking: 'Post-order DFS traversal with maximum gain propagation.',
            problemSummary: 'Find maximum path sum across all nodes.',
            algorithm: 'DFS recursion checking at each node apex.',
            correctness: 'Pruning negative subtrees with max(0, gain).',
            code: 'class Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        self.max_sum = float("-inf")\n        # ... optimal code',
            language: 'python3',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(H)',
            edgeCases: ['All negative numbers'],
            assumptions: ['Tree has at least one node']
          },
          timestamp: Date.now()
        };
        setHistory([demoEntry]);
        setSelectedEntry(demoEntry);
      }
    })();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content history-modal-content">
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <GitBranch size={20} color="#38bdf8" />
            <div>
              <h2 className="modal-title">Revision History & Branches</h2>
              <p className="modal-subtitle">Browse and restore previously generated solutions</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="history-modal-body">
          {history.length === 0 ? (
            <div className="empty-history-state">
              <Clock size={32} color="#64748b" />
              <p>No solution revisions saved yet. Generate code to populate history.</p>
            </div>
          ) : (
            <div className="history-grid-layout">
              {/* Left Column: Revision list */}
              <div className="history-list-column">
                <span className="history-section-label">SAVED REVISIONS ({history.length})</span>
                <div className="history-items-container">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={`history-item-card ${selectedEntry?.slug === item.slug ? 'selected' : ''}`}
                      onClick={() => setSelectedEntry(item)}
                    >
                      <div className="history-item-slug">{item.slug}</div>
                      <div className="history-item-meta">
                        <span>{item.solution.language || 'Code'}</span>
                        <span>{item.solution.timeComplexity || 'O(N)'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Code Preview & Actions */}
              {selectedEntry && (
                <div className="history-preview-column">
                  <div className="history-preview-header">
                    <span className="history-preview-title">{selectedEntry.slug}</span>
                    <div className="history-preview-actions">
                      <button
                        className="mini-pill-btn"
                        onClick={() => handleCopy(selectedEntry.solution.code)}
                        title="Copy code"
                      >
                        {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        className="mini-pill-btn restore-pill"
                        onClick={() => {
                          onRestoreSolution(selectedEntry.solution);
                          onClose();
                        }}
                        title="Restore to active view"
                      >
                        <RotateCcw size={12} />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>

                  <pre className="history-code-preview">
                    <code>{selectedEntry.solution.code}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
