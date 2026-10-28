import React, { useState } from 'react';
import { X, Upload, ExternalLink, Trash2, CheckCircle2, BookmarkPlus, Play } from 'lucide-react';
import { ImportedProblem, ProblemContext } from '../../types';

interface ImportProblemsModalProps {
  importedProblems: ImportedProblem[];
  onSaveProblems: (problems: ImportedProblem[]) => void;
  onSelectProblem?: (problem: ProblemContext) => void;
  onClose: () => void;
}

const BLIND_75_PRESET: ImportedProblem[] = [
  { title: '1. Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', topic: 'Array & Hash Table' },
  { title: '121. Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy', topic: 'Dynamic Programming' },
  { title: '217. Contains Duplicate', url: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy', topic: 'Array' },
  { title: '242. Valid Anagram', url: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy', topic: 'Hash Table' },
  { title: '20. Valid Parentheses', url: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'Easy', topic: 'Stack' },
  { title: '53. Maximum Subarray', url: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium', topic: 'Dynamic Programming' },
  { title: '42. Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'Hard', topic: 'Two Pointers' },
  { title: '146. LRU Cache', url: 'https://leetcode.com/problems/lru-cache/', difficulty: 'Medium', topic: 'Design' }
];

export const ImportProblemsModal: React.FC<ImportProblemsModalProps> = ({
  importedProblems,
  onSaveProblems,
  onSelectProblem,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parseJSONorCSV = (text: string): ImportedProblem[] => {
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      return parsed.map((item: any) => ({
        title: item.title || item.name || 'Untitled Problem',
        url: item.url || (item.slug ? `https://leetcode.com/problems/${item.slug}/` : ''),
        difficulty: item.difficulty || 'Unknown',
        topic: item.topic || ''
      }));
    } else {
      const lines = trimmed.split('\n');
      const results: ImportedProblem[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          results.push({
            title: parts[0],
            url: parts[1],
            difficulty: (parts[2] as any) || 'Unknown'
          });
        }
      }
      return results;
    }
  };

  const handleImport = () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const parsed = parseJSONorCSV(inputText);
      if (parsed.length === 0) {
        throw new Error('No valid problems detected. Provide valid JSON array or CSV lines (title, url, difficulty).');
      }
      const combined = [...importedProblems, ...parsed];
      onSaveProblems(combined);
      setInputText('');
      setSuccessMsg(`Successfully imported ${parsed.length} problems!`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse problem list');
    }
  };

  const handleLoadPreset = () => {
    setError(null);
    const existingUrls = new Set(importedProblems.map((p) => p.url));
    const toAdd = BLIND_75_PRESET.filter((p) => !existingUrls.has(p.url));
    const combined = [...importedProblems, ...toAdd];
    onSaveProblems(combined);
    setSuccessMsg(`Loaded ${toAdd.length} curated Blind 75 problems!`);
  };

  const handleRemove = (index: number) => {
    const updated = importedProblems.filter((_, idx) => idx !== index);
    onSaveProblems(updated);
  };

  const handleClearAll = () => {
    onSaveProblems([]);
  };

  const openProblemInTab = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const handleSelectProblem = (p: ImportedProblem) => {
    if (onSelectProblem) {
      const slugMatch = p.url?.match(/problems\/([a-z0-9_-]+)/i);
      const slug = slugMatch ? slugMatch[1] : 'custom-problem';
      const context: ProblemContext = {
        title: p.title,
        slug,
        url: p.url,
        difficulty: (p.difficulty as any) || 'Medium',
        statement: `Problem: ${p.title}\nCategory: ${p.topic || 'Algorithms'}\nLink: ${p.url}`,
        examples: [],
        constraints: [],
        starterCode: '',
        editorLanguage: 'python3'
      };
      onSelectProblem(context);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Import Problem Lists (JSON / CSV)</h2>
          <button className="icon-button" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Import your curated problem sets (Blind 75, NeetCode 150) as JSON or CSV to open or solve directly.
          </div>

          <div className="form-group">
            <label className="form-label">Paste JSON or CSV</label>
            <textarea
              className="text-input"
              rows={4}
              placeholder={'JSON format:\n[{"title":"Two Sum","url":"https://leetcode.com/problems/two-sum/","difficulty":"Easy"}]\n\nOr CSV format:\nTwo Sum,https://leetcode.com/problems/two-sum/,Easy'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>

          {error && (
            <div className="status-banner error">
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="status-banner success">
              <CheckCircle2 size={13} />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!inputText.trim()}
              title="Parse and add problems from textarea"
            >
              <Upload size={13} />
              Add Problems
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleLoadPreset}
              title="Add 8 curated classic Blind 75 problems"
            >
              <BookmarkPlus size={13} />
              Load Blind 75 Preset
            </button>

            {importedProblems.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleClearAll}
                style={{ marginLeft: 'auto', color: 'var(--error-color)' }}
                title="Remove all imported problems"
              >
                Clear All ({importedProblems.length})
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px' }}>
              Imported Problems ({importedProblems.length})
            </div>
            {importedProblems.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '12px 0' }}>
                No problems imported yet. Click "Load Blind 75 Preset" to test instantly!
              </div>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {importedProblems.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.title}</strong>{' '}
                      {p.difficulty && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({p.difficulty})</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onSelectProblem && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSelectProblem(p)}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                          title="Select this problem in Copilot"
                        >
                          <Play size={10} />
                          Select
                        </button>
                      )}
                      {p.url && (
                        <button
                          className="icon-button"
                          onClick={() => openProblemInTab(p.url)}
                          title="Open problem in new tab"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        onClick={() => handleRemove(idx)}
                        title="Remove from list"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
