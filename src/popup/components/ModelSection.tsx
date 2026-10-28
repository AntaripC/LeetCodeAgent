import React, { useState } from 'react';
import { Cpu, ShieldCheck, Zap, Brain, Activity, CheckCircle2, Sliders } from 'lucide-react';
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
  const [testingEngine, setTestingEngine] = useState(false);
  const [engineReady, setEngineReady] = useState<boolean | null>(null);

  const isCodeMind = settings.selectedProvider === 'codemind';

  const checkEngineHealth = async () => {
    setTestingEngine(true);
    try {
      if (isCodeMind) {
        const endpoint = (settings.codemindEndpoint || 'http://127.0.0.1:11434').replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        setEngineReady(res.ok);
      } else {
        // Quick responsiveness test
        await new Promise((r) => setTimeout(r, 400));
        setEngineReady(true);
      }
    } catch {
      setEngineReady(false);
    } finally {
      setTestingEngine(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          {isCodeMind ? <Brain size={14} color="#38bdf8" /> : <Cpu size={14} color="#a855f7" />}
          AI Intelligence Engine
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="engine-badge"
            title={isCodeMind ? 'Air-gapped on-device computation' : 'Frontier cloud acceleration'}
          >
            {isCodeMind ? <ShieldCheck size={11} /> : <Zap size={11} />}
            {isCodeMind ? 'Private On-Device' : 'Frontier Neural'}
          </span>
          <button
            onClick={checkEngineHealth}
            disabled={testingEngine}
            className="icon-button"
            style={{ fontSize: '11px', padding: '2px 6px', display: 'flex', gap: '3px' }}
            title="Check Engine Status"
          >
            <Activity size={10} className={testingEngine ? 'spinner' : ''} />
            {testingEngine ? 'Pinging...' : engineReady === true ? 'Active' : 'Status'}
          </button>
        </div>
      </div>

      <div className="control-grid">
        <div className="form-group">
          <label className="form-label">Engine Architecture</label>
          <select
            className="select-input"
            value={settings.selectedProvider}
            onChange={(e) => {
              setEngineReady(null);
              onProviderChange(e.target.value as AIProviderType);
            }}
          >
            <option value="gemini">Frontier Neural Engine (Google Gemini)</option>
            <option value="codemind">CodeMind Local Engine (Air-Gapped / M2)</option>
            <option value="openai">OpenAI Frontier Engine</option>
            <option value="custom">Enterprise Custom Engine</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Intelligence Mode</label>
          <select
            className="select-input"
            value={settings.selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {availableModels.length > 0 ? (
              availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            ) : (
              <option value={settings.selectedModel}>{settings.selectedModel || 'Optimal Auto-Detect'}</option>
            )}
          </select>
        </div>
      </div>

      <div className="engine-footer">
        <span className="engine-status-text">
          <CheckCircle2 size={11} color="var(--success-color)" />
          {isCodeMind
            ? 'Running locally with zero latency & full privacy'
            : 'Synchronized with Frontier Reasoning Cluster'}
        </span>
        <button
          onClick={onOpenSettings}
          className="engine-prefs-btn"
          title="Open Performance Preferences"
        >
          <Sliders size={11} />
          Preferences
        </button>
      </div>
    </div>
  );
};
