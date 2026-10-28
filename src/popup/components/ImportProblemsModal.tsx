import React, { useState } from 'react';
import { X, Upload, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { ImportedProblem } from '../../types';

interface ImportProblemsModalProps {
  importedProblems: ImportedProblem[];
  onSaveProblems: (problems: ImportedProblem[]) => void;
  onClose: () => void;
}

export const ImportProblemsModal: React.FC<ImportProblemsModalProps> = ({
  importedProblems,
  onSaveProblems,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parseJSONorCSV = (text: string): ImportedProblem[] => {
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
      // JSON Array
      const parsed = JSON.parse(trimmed);
      return parsed.map((item: any) => ({
        title: item.title || item.name || 'Untitled Problem',
        url: item.url || (item.slug ? `https://leetcode.com/problems/${item.slug}/` : ''),
        difficulty: item.difficulty || 'Unknown',
        topic: item.topic || ''
      }));
    } else {
      // CSV format: title,url,difficulty
      const lines = trimmed.split('\n');
      const results: ImportedProblem[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Import Problem Lists (JSON / CSV)</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Import your curated problem sets (e.g., Blind 75, NeetCode 150) as JSON or CSV without scraping.
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!inputText.trim()}
            >
              <Upload size={13} />
              Add Problems
            </button>
            {importedProblems.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleClearAll}
                style={{ marginLeft: 'auto', color: 'var(--error-color)' }}
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
                No problems imported yet.
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
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.title}</strong>{' '}
                      {p.difficulty && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({p.difficulty})</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
