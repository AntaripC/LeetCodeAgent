import React, { useState } from 'react';
import { X, Check, Activity, ShieldAlert, Server, Shield, Clock, AlertTriangle } from 'lucide-react';
import { ExtensionSettings, AIProviderType, ProviderConnectionTestResult } from '../../types';

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

  const handleTest = async (provider: AIProviderType) => {
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
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>Settings, Models & Safeguards</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tab-nav" style={{ flexWrap: 'wrap', gap: '2px' }}>
            <button
              className={`tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
              onClick={() => { setActiveTab('gemini'); setTestResult(null); }}
            >
              Gemini
            </button>
            <button
              className={`tab-btn ${activeTab === 'openai' ? 'active' : ''}`}
              onClick={() => { setActiveTab('openai'); setTestResult(null); }}
            >
              OpenAI
            </button>
            <button
              className={`tab-btn ${activeTab === 'backend' ? 'active' : ''}`}
              onClick={() => { setActiveTab('backend'); setTestResult(null); }}
            >
              <Server size={11} style={{ display: 'inline', marginRight: '2px' }} />
              Local Proxy
            </button>
            <button
              className={`tab-btn ${activeTab === 'safeguards' ? 'active' : ''}`}
              onClick={() => { setActiveTab('safeguards'); setTestResult(null); }}
            >
              <Shield size={11} style={{ display: 'inline', marginRight: '2px' }} />
              Safeguards
            </button>
            <button
              className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => { setActiveTab('usage'); setTestResult(null); }}
            >
              <Clock size={11} style={{ display: 'inline', marginRight: '2px' }} />
              Logs ({formData.usageRecords?.length || 0})
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
                <input
                  type="password"
                  className="text-input"
                  placeholder="AIzaSy..."
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                />
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
                disabled={testing || (!formData.geminiApiKey.trim() && !formData.localBackend?.enabled)}
                onClick={() => handleTest('gemini')}
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
                <input
                  type="password"
                  className="text-input"
                  placeholder="sk-proj-..."
                  value={formData.openaiApiKey}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                />
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
                disabled={testing || (!formData.openaiApiKey.trim() && !formData.localBackend?.enabled)}
                onClick={() => handleTest('openai')}
              >
                <Activity size={13} className={testing ? 'spinner' : ''} />
                {testing ? 'Testing OpenAI Connection...' : 'Test Connection'}
              </button>
            </div>
          )}

          {activeTab === 'backend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Keep API keys completely off the browser extension by routing requests through a local proxy server.
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={formData.localBackend?.enabled || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      localBackend: {
                        ...(formData.localBackend || { baseUrl: 'http://localhost:3001' }),
                        enabled: e.target.checked
                      }
                    })
                  }
                />
                <span style={{ fontWeight: 600 }}>Enable Local Backend Proxy</span>
              </label>

              <div className="form-group">
                <label className="form-label">Local Proxy Server URL</label>
                <input
                  type="text"
                  className="text-input"
                  value={formData.localBackend?.baseUrl || 'http://localhost:3001'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      localBackend: {
                        ...(formData.localBackend || { enabled: false }),
                        baseUrl: e.target.value
                      }
                    })
                  }
                />
              </div>

              <div style={{ background: '#090b10', padding: '8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                Run server: <strong>npm run server</strong><br/>
                Reads: <strong>.env (GEMINI_API_KEY, OPENAI_API_KEY)</strong>
              </div>
            </div>
          )}

          {activeTab === 'safeguards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Configure spending caps and alerts to prevent unexpected API costs.
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={formData.safeguards?.enabled ?? true}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { maxRequestsPerDay: 50, warnBeforeReasoningModels: true }),
                        enabled: e.target.checked
                      }
                    })
                  }
                />
                <span style={{ fontWeight: 600 }}>Enable Daily Request Safeguard</span>
              </label>

              <div className="form-group">
                <label className="form-label">Max Requests per 24 Hours</label>
                <input
                  type="number"
                  className="text-input"
                  min={5}
                  max={500}
                  value={formData.safeguards?.maxRequestsPerDay || 50}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { enabled: true, warnBeforeReasoningModels: true }),
                        maxRequestsPerDay: parseInt(e.target.value) || 50
                      }
                    })
                  }
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={formData.safeguards?.warnBeforeReasoningModels ?? true}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...(formData.safeguards || { enabled: true, maxRequestsPerDay: 50 }),
                        warnBeforeReasoningModels: e.target.checked
                      }
                    })
                  }
                />
                <span>Warn before using heavy reasoning models (Gemini 4 Argon, GPT-6.1 Sol)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={formData.confirmBeforeOverwrite}
                  onChange={(e) => setFormData({ ...formData, confirmBeforeOverwrite: e.target.checked })}
                />
                <span>Confirm before overwriting existing editor code</span>
              </label>
            </div>
          )}

          {activeTab === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                Recent Activity & Diagnostics
              </div>
              {(!formData.usageRecords || formData.usageRecords.length === 0) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '16px' }}>
                  No requests recorded yet.
                </div>
              ) : (
                formData.usageRecords.slice(0, 15).map((rec, i) => (
                  <div
                    key={rec.id || i}
                    style={{
                      background: 'var(--bg-tertiary)',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{rec.provider.toUpperCase()}</strong>: {rec.model} ({rec.action})
                      {rec.error && <div style={{ color: 'var(--error-color)' }}>{rec.error}</div>}
                    </div>
                    <div style={{ textAlign: 'right', color: rec.success ? 'var(--success-color)' : 'var(--error-color)' }}>
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
              style={{ marginTop: '4px' }}
            >
              {testResult.success ? <Check size={14} /> : <ShieldAlert size={14} />}
              <div>
                <strong>{testResult.success ? 'Connected!' : 'Connection Failed:'}</strong>{' '}
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSaveAndClose}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
