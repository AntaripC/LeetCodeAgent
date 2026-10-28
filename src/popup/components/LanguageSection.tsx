import React from 'react';
import { Code2, RefreshCw, AlertTriangle } from 'lucide-react';
import { LanguageRegistry, SUPPORTED_LANGUAGES } from '../../solver/language-registry';

interface LanguageSectionProps {
  targetLanguage: string;
  editorLanguage: string;
  useEditorLanguage: boolean;
  onLanguageChange: (langId: string) => void;
  onToggleUseEditorLanguage: (useEditor: boolean) => void;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({
  targetLanguage,
  editorLanguage,
  useEditorLanguage,
  onLanguageChange,
  onToggleUseEditorLanguage
}) => {
  const isCompatible = LanguageRegistry.areLanguagesCompatible(targetLanguage, editorLanguage);
  const editorDisplayName = LanguageRegistry.getDisplayName(editorLanguage);
  const targetDisplayName = LanguageRegistry.getDisplayName(targetLanguage);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Code2 size={13} />
          Target Programming Language
        </span>
        <button
          onClick={() => {
            onToggleUseEditorLanguage(true);
            onLanguageChange(editorLanguage);
          }}
          className="icon-button"
          title={`Match LeetCode Editor (${editorDisplayName})`}
          style={{ fontSize: '11px', display: 'flex', gap: '4px', padding: '3px 8px' }}
        >
          <RefreshCw size={11} />
          Sync with Editor
        </button>
      </div>

      <div className="control-grid">
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <select
            className="select-input"
            value={targetLanguage}
            onChange={(e) => {
              onToggleUseEditorLanguage(false);
              onLanguageChange(e.target.value);
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.displayName} {lang.id === editorLanguage ? '(Active in LeetCode)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isCompatible && editorLanguage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--warning-color)',
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '6px 8px',
            borderRadius: '4px'
          }}
        >
          <AlertTriangle size={13} />
          <span>
            Selected language (<strong>{targetDisplayName}</strong>) differs from active editor (
            <strong>{editorDisplayName}</strong>).
          </span>
          <button
            onClick={() => {
              onLanguageChange(editorLanguage);
              onToggleUseEditorLanguage(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '11px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            Switch to {editorDisplayName}
          </button>
        </div>
      )}
    </div>
  );
};
