import React, { useState } from 'react';
import { X, Check, Activity, ShieldAlert, Server, Shield, Clock, AlertTriangle, Eye, EyeOff, RotateCcw, Download, Trash2 } from 'lucide-react';
import { ExtensionSettings, AIProviderType, ProviderConnectionTestResult } from '../../types';
import { DEFAULT_SETTINGS } from '../../storage/extension-storage';

interface SettingsModalProps {
  settings: ExtensionSettings;
  onSave: (newSettings: Partial<ExtensionSettings>) => void;
  onClose: () => void;
  onTestConnection: (provider: AIProviderType) => Promise<ProviderConnectionTestResult>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onTestConnection
}) => {
  const [formData, setFormData] = useState<ExtensionSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'gemini' | 'openai' | 'custom' | 'backend' | 'safeguards' | 'usage'>('gemini');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProviderConnectionTestResult | null>(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTest = async (provider: AIProviderType) => {
    const key =
      provider === 'gemini'
        ? formData.geminiApiKey
        : provider === 'openai'
        ? formData.openaiApiKey
        : formData.customApiKey;

    const isLocalEnabled = formData.localBackend?.enabled;

    if (!isLocalEnabled && (!key || !key.trim())) {
      setTestResult({
        success: false,
        message: `Please enter an API key for ${
          provider === 'gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : 'Custom Provider'
        } first, or enable the Local Proxy.`
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      await onSave(formData);
      const res = await onTestConnection(provider);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndClose = () => {
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all settings to recommended defaults?')) {
      setFormData({ ...DEFAULT_SETTINGS });
      setTestResult({
        success: true,
        message: 'Settings reset to defaults. Click "Save Changes" to apply.'
      });
    }
  };

  const handleExportLogs = () => {
    const logs = formData.usageHistory || [];
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leetcode-copilot-usage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Clear all local usage history and metrics?')) {
      setFormData({ ...formData, usageHistory: [] });
      setTestResult({ success: true, message: 'Usage history cleared.' });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>Settings, Models & Safeguards</h2>
          <button className="icon-button" onClick={onClose} title="Close Settings">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tab-nav" style={{ flexWrap: 'wrap', gap: '2px' }}>
            <button
              className={`tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
              onClick={() => { setActiveTab('gemini'); setTestResult(null); }}
              title="Google Gemini API key and frontier model options"
            >
              Gemini
            </button>
            <button
              className={`tab-btn ${activeTab === 'openai' ? 'active' : ''}`}
              onClick={() => { setActiveTab('openai'); setTestResult(null); }}
              title="OpenAI API key and GPT-6 models"
            >
              OpenAI
            </button>
            <button
              className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => { setActiveTab('custom'); setTestResult(null); }}
              title="Self-hosted Ollama, Groq, or vLLM endpoints"
            >
              Custom
            </button>
            <button
              className={`tab-btn ${activeTab === 'backend' ? 'active' : ''}`}
              onClick={() => { setActiveTab('backend'); setTestResult(null); }}
              title="Local zero-secret proxy server"
            >
              <Server size={11} style={{ marginRight: '3px', display: 'inline' }} />
              Local Proxy
            </button>
            <button
              className={`tab-btn ${activeTab === 'safeguards' ? 'active' : ''}`}
              onClick={() => { setActiveTab('safeguards'); setTestResult(null); }}
              title="Daily request caps and budget safeguards"
            >
              <Shield size={11} style={{ marginRight: '3px', display: 'inline' }} />
              Safeguards
            </button>
            <button
              className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => { setActiveTab('usage'); setTestResult(null); }}
              title="Usage logs and latency telemetry"
            >
              <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />
              Logs
            </button>
          </div>

          {activeTab === 'gemini' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Gemini API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '11px' }}
                  >
                    Get free key &rarr;
                  </a>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    className="text-input"
                    placeholder="AIzaSy..."
                    value={formData.geminiApiKey}
                    onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    style={{ paddingRight: '32px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="icon-button"
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                    title={showGeminiKey ? 'Hide key' : 'Show key'}
                  >
                    {showGeminiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Model Selection</label>
                <select
                  className="select-input"
                  value={formData.geminiModel}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                >
                  <option value="gemini-4-argon">Gemini 4 Argon (Latest Frontier Reasoning & Coding)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (High Speed & Efficiency)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Gemini Model ID (Optional)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. gemini-4-argon or fine-tuned model"
                  value={formData.geminiCustomModel || ''}
                  onChange={(e) => setFormData({ ...formData, geminiCustomModel: e.target.value })}
                />
              </div>

              <button
                className="btn btn-secondary"
                disabled={testing}
                onClick={() => handleTest('gemini')}
                title="Send test ping to Gemini API"
              >
                <Activity size={13} className={testing ? 'spinner' : ''} />
                {testing ? 'Testing Gemini Connection...' : 'Test Connection'}
              </button>
            </div>
          )}

          {activeTab === 'openai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>OpenAI API Key</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '11px' }}
                  >
                    Get key &rarr;
                  </a>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showOpenaiKey ? 'text' : 'password'}
                    className="text-input"
                    placeholder="sk-proj-..."
                    value={formData.openaiApiKey}
                    onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                    style={{ paddingRight: '32px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="icon-button"
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                    title={showOpenaiKey ? 'Hide key' : 'Show key'}
                  >
                    {showOpenaiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Model Selection</label>
                <select
                  className="select-input"
                  value={formData.openaiModel}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                >
                  <option value="gpt-6-astra">GPT-6 Astra (Latest Frontier Coding & Intelligence)</option>
                  <option value="gpt-6.1-sol">GPT-6.1 Sol (Next-Gen Deep Reasoning)</option>
                  <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Efficient)</option>
                  <option value="o3-mini">o3-mini (Advanced Reasoning)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom OpenAI Model ID (Optional)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. gpt-6-astra, gpt-6.1-sol, or o3-mini"
                  value={formData.openaiCustomModel || ''}
                  onChange={(e) => setFormData({ ...formData, openaiCustomModel: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Base URL (Optional)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="https://api.openai.com/v1"
                  value={formData.openaiBaseUrl || ''}
                  onChange={(e) => setFormData({ ...formData, openaiBaseUrl: e.target.value })}
                />
              </div>

              <button
                className="btn btn-secondary"
                disabled={testing}
                onClick={() => handleTest('openai')}
                title="Send test ping to OpenAI API"
              >
                <Activity size={13} className={testing ? 'spinner' : ''} />
                {testing ? 'Testing OpenAI Connection...' : 'Test Connection'}
              </button>
            </div>
          )}

          {activeTab === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Endpoint Base URL</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="http://localhost:11434/v1"
                  value={formData.customBaseUrl}
                  onChange={(e) => setFormData({ ...formData, customBaseUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="llama-3.3-70b-versatile or qwen2.5-coder:32b"
                  value={formData.customModel}
                  onChange={(e) => setFormData({ ...formData, customModel: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Key (Optional for local Ollama)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCustomKey ? 'text' : 'password'}
                    className="text-input"
                    placeholder="ollama or your-api-key"
                    value={formData.customApiKey}
                    onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
                    style={{ paddingRight: '32px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomKey(!showCustomKey)}
                    className="icon-button"
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    {showCustomKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                disabled={testing}
                onClick={() => handleTest('custom')}
                title="Test custom endpoint connection"
              >
                <Activity size={13} className={testing ? 'spinner' : ''} />
                {testing ? 'Testing Custom Endpoint...' : 'Test Connection'}
              </button>
            </div>
          )}

          {activeTab === 'backend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Keep your API secrets 100% off Chrome extension storage by routing requests through a local Node.js proxy server.
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.localBackend?.enabled || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      localBackend: {
                        ...(formData.localBackend || { url: 'http://localhost:3001' }),
                        enabled: e.target.checked
                      }
                    })
                  }
                />
                Route API calls through Local Backend Server
              </label>

              <div className="form-group">
                <label className="form-label">Local Backend URL</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="http://localhost:3001"
                  value={formData.localBackend?.url || 'http://localhost:3001'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      localBackend: {
                        ...(formData.localBackend || { enabled: false }),
                        url: e.target.value
                      }
                    })
                  }
                />
              </div>

              <button
                className="btn btn-secondary"
                disabled={testing}
                onClick={async () => {
                  setTesting(true);
                  setTestResult(null);
                  try {
                    const url = (formData.localBackend?.url || 'http://localhost:3001').replace(/\/+$/, '');
                    const res = await fetch(`${url}/health`);
                    if (res.ok) {
                      const data = await res.json();
                      setTestResult({
                        success: true,
                        message: `Local server online: ${data.message || 'Healthy'}`
                      });
                    } else {
                      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                  } catch (e: any) {
                    setTestResult({
                      success: false,
                      message: `Could not reach local server: ${e.message}. Start it via: npm run server`
                    });
                  } finally {
                    setTesting(false);
                  }
                }}
                title="Verify local server health check"
              >
                <Activity size={13} className={testing ? 'spinner' : ''} />
                {testing ? 'Pinging Local Server...' : 'Test Local Server (/health)'}
              </button>
            </div>
          )}

          {activeTab === 'safeguards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Daily Request Cap (0 = Unlimited)</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  className="text-input"
                  value={formData.safeguards?.dailyRequestCap || 50}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { alertOnReasoningModels: true, maxOutputTokens: 4096 }),
                        dailyRequestCap: parseInt(e.target.value, 10) || 0
                      }
                    })
                  }
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.safeguards?.alertOnReasoningModels !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { dailyRequestCap: 50, maxOutputTokens: 4096 }),
                        alertOnReasoningModels: e.target.checked
                      }
                    })
                  }
                />
                Confirm before querying expensive reasoning models (GPT-6.1 Sol, Gemini 4 Argon)
              </label>

              <div className="form-group">
                <label className="form-label">Max Output Tokens</label>
                <input
                  type="number"
                  min="512"
                  max="16384"
                  step="512"
                  className="text-input"
                  value={formData.safeguards?.maxOutputTokens || 4096}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { dailyRequestCap: 50, alertOnReasoningModels: true }),
                        maxOutputTokens: parseInt(e.target.value, 10) || 4096
                      }
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formData.usageHistory?.length || 0} calls recorded
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportLogs}
                    style={{ fontSize: '10px', padding: '3px 6px' }}
                    title="Export usage history as JSON"
                  >
                    <Download size={10} />
                    Export
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClearLogs}
                    style={{ fontSize: '10px', padding: '3px 6px', color: 'var(--error-color)' }}
                    title="Clear usage history"
                  >
                    <Trash2 size={10} />
                    Clear
                  </button>
                </div>
              </div>

              {(!formData.usageHistory || formData.usageHistory.length === 0) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                  No usage records yet. Run your first solve to see latency and telemetry.
                </div>
              ) : (
                formData.usageHistory.slice(-5).reverse().map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{rec.model}</strong> ({rec.action})
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ color: rec.success ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 600 }}>
                      {rec.success ? `${rec.latencyMs}ms` : 'Failed'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {testResult && (
            <div
              className={`status-banner ${testResult.success ? 'success' : 'error'}`}
              style={{ marginTop: '10px' }}
            >
              {testResult.success ? <Check size={14} /> : <ShieldAlert size={14} />}
              <div>
                <strong>{testResult.success ? 'Connected!' : 'Notice:'}</strong> {testResult.message}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleResetDefaults}
            style={{ fontSize: '11px', color: 'var(--text-muted)' }}
            title="Reset to recommended factory settings"
          >
            <RotateCcw size={11} />
            Reset Defaults
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose} title="Cancel without saving">
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveAndClose} title="Save changes and close">
              {savedSuccess ? <Check size={13} color="#fff" /> : null}
              {savedSuccess ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
