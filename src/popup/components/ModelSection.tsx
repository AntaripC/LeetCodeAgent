import React from 'react';
import { Cpu, Key, AlertTriangle } from 'lucide-react';
import { AIProviderType, ExtensionSettings, ModelOption } from '../../types';

interface ModelSectionProps {
  settings: ExtensionSettings;
  availableModels: ModelOption[];
  onProviderChange: (provider: AIProviderType) => void;
  onModelChange: (modelId: string) => void;
  onOpenSettings: () => void;
}

export const ModelSection: React.FC<ModelSectionProps> = ({
  settings,
  availableModels,
  onProviderChange,
  onModelChange,
  onOpenSettings
}) => {
  const isKeyConfigured = () => {
    switch (settings.selectedProvider) {
      case 'gemini':
        return !!settings.geminiApiKey?.trim();
      case 'openai':
        return !!settings.openaiApiKey?.trim();
      case 'custom':
        return !!settings.customBaseUrl?.trim();
    }
  };

  const configured = isKeyConfigured();

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Cpu size={13} />
          AI Model & Provider
        </span>
        {!configured && (
          <button
            onClick={onOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--warning-color)',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Key size={11} />
            Add API Key
          </button>
        )}
      </div>

      <div className="control-grid">
        <div className="form-group">
          <label className="form-label">Provider</label>
          <select
            className="select-input"
            value={settings.selectedProvider}
            onChange={(e) => onProviderChange(e.target.value as AIProviderType)}
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom / Compatible</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <select
            className="select-input"
            value={settings.selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!configured && (
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
          <span>API key required for {settings.selectedProvider.toUpperCase()}.</span>
          <button
            onClick={onOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '11px',
              marginLeft: 'auto'
            }}
          >
            Configure
          </button>
        </div>
      )}
    </div>
  );
};
