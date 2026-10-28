import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface OverwriteModalProps {
  previousSnippet: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OverwriteModal: React.FC<OverwriteModalProps> = ({
  previousSnippet,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color)' }}>
            <AlertTriangle size={16} />
            Confirm Overwrite
          </h2>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Your LeetCode editor already contains existing code. Inserting this AI solution will replace your current editor buffer.
          </p>

          {previousSnippet && (
            <div
              style={{
                background: '#090b10',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#94a3b8',
                maxHeight: '100px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}
            >
              {previousSnippet}...
            </div>
          )}

          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Would you like to proceed with overwriting your editor code?
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel & Keep My Code
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Yes, Replace Code
          </button>
        </div>
      </div>
    </div>
  );
};
