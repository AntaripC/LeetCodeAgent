import React, { useState } from 'react';
import { Cpu, Key, AlertTriangle, Brain, Activity, CheckCircle2, XCircle } from 'lucide-react';
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
  const [testingLocal, setTestingLocal] = useState(false);
  const [localStatus, setLocalStatus] = useState<{
    tested: boolean;
    online: boolean;
    message?: string;
  }>({ tested: false, online: false });

  const isKeyConfigured = () => {
    switch (settings.selectedProvider) {
      case 'codemind':
        return settings.codemindEnabled !== false && !!settings.codemindEndpoint?.trim();
      case 'gemini':
        return !!settings.geminiApiKey?.trim();
      case 'openai':
        return !!settings.openaiApiKey?.trim();
      case 'custom':
        return !!settings.customBaseUrl?.trim();
      default:
        return true;
    }
  };

  const checkLocalOllama = async () => {
    setTestingLocal(true);
    const endpoint = (settings.codemindEndpoint || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        setLocalStatus({ tested: true, online: true, message: 'Ollama is online' });
      } else {
        setLocalStatus({ tested: true, online: false, message: `HTTP ${res.status}` });
      }
    } catch {
      setLocalStatus({
        tested: true,
        online: false,
        message: 'Ollama not running (run: ollama serve)'
      });
    } finally {
      setTestingLocal(false);
    }
  };

  const configured = isKeyConfigured();
  const isCodeMind = settings.selectedProvider === 'codemind';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          {isCodeMind ? <Brain size={14} color="#38bdf8" /> : <Cpu size={13} />}
          AI Model & Provider
        </span>
        {isCodeMind ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {localStatus.tested && (
              <span
                style={{
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: localStatus.online ? 'var(--success-color)' : 'var(--warning-color)'
                }}
              >
                {localStatus.online ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {localStatus.online ? 'Running' : 'Offline'}
              </span>
            )}
            <button
              onClick={checkLocalOllama}
              disabled={testingLocal}
              className="icon-button"
              style={{ fontSize: '10px', padding: '2px 6px', display: 'flex', gap: '3px' }}
              title="Ping local Ollama runtime"
            >
              <Activity size={10} className={testingLocal ? 'spinner' : ''} />
              {testingLocal ? 'Checking...' : 'Ping Local'}
            </button>
          </div>
        ) : (
          !configured && (
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
          )
        )}
      </div>

      <div className="control-grid">
        <div className="form-group">
          <label className="form-label">Provider</label>
          <select
            className="select-input"
            value={settings.selectedProvider}
            onChange={(e) => {
              setLocalStatus({ tested: false, online: false });
              onProviderChange(e.target.value as AIProviderType);
            }}
          >
            <option value="codemind">CodeMind AI (Local M2 / Ollama)</option>
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

      {isCodeMind && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'rgba(56, 189, 248, 0.08)',
            padding: '6px 8px',
            borderRadius: '4px',
            marginTop: '4px'
          }}
        >
          <span>
            Endpoint: <code>{settings.codemindEndpoint || 'http://127.0.0.1:11434'}</code>
          </span>
          <button
            onClick={onOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Settings
          </button>
        </div>
      )}

      {!configured && !isCodeMind && (
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
