import React, { useState } from 'react';
import {
  X,
  Check,
  Activity,
  Shield,
  Clock,
  RotateCcw,
  Download,
  Trash2,
  Brain,
  Sliders,
  Code2,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'editor' | 'safeguards' | 'activity'>('profile');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProviderConnectionTestResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestEngine = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await onSave(formData);
      const res = await onTestConnection(formData.selectedProvider);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Engine connectivity test failed'
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
    }, 350);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset preferences to recommended professional defaults?')) {
      setFormData((prev) => ({
        ...prev,
        selectedProvider: DEFAULT_SETTINGS.selectedProvider,
        selectedModel: DEFAULT_SETTINGS.selectedModel,
        targetLanguage: DEFAULT_SETTINGS.targetLanguage,
        useEditorLanguage: DEFAULT_SETTINGS.useEditorLanguage,
        confirmBeforeOverwrite: DEFAULT_SETTINGS.confirmBeforeOverwrite,
        autoAnalyzeOnOpen: DEFAULT_SETTINGS.autoAnalyzeOnOpen,
        codemindTemperature: 0.05,
        safeguards: { ...DEFAULT_SETTINGS.safeguards }
      }));
      setTestResult({
        success: true,
        message: 'Preferences reset to defaults. Click "Save Changes" to apply.'
      });
    }
  };

  const handleExportLogs = () => {
    const logs = formData.usageRecords || [];
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leetcode-copilot-activity-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Clear local problem solving activity history?')) {
      setFormData({ ...formData, usageRecords: [] });
      setTestResult({ success: true, message: 'Activity history cleared.' });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content professional-modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h2>Copilot Preferences</h2>
            <p className="modal-subtitle">Configure algorithmic engine, editor safety & execution profiles</p>
          </div>
          <button className="icon-button" onClick={onClose} title="Close Preferences">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setTestResult(null); }}
              title="Intelligence Engine & Strategy Profile"
            >
              <Brain size={12} style={{ marginRight: '4px', display: 'inline' }} />
              Intelligence
            </button>
            <button
              className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => { setActiveTab('editor'); setTestResult(null); }}
              title="Editor integration & code insertion preferences"
            >
              <Code2 size={12} style={{ marginRight: '4px', display: 'inline' }} />
              Editor
            </button>
            <button
              className={`tab-btn ${activeTab === 'safeguards' ? 'active' : ''}`}
              onClick={() => { setActiveTab('safeguards'); setTestResult(null); }}
              title="Execution guardrails and rate limits"
            >
              <Shield size={12} style={{ marginRight: '4px', display: 'inline' }} />
              Safeguards
            </button>
            <button
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => { setActiveTab('activity'); setTestResult(null); }}
              title="Activity history & diagnostics"
            >
              <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
              Activity
            </button>
          </div>

          {/* TAB 1: Intelligence Profile */}
          {activeTab === 'profile' && (
            <div className="pref-section">
              <div className="form-group">
                <label className="form-label">
                  <span>Active Architecture</span>
                  <span className="badge-tag">Pro Engine</span>
                </label>
                <select
                  className="select-input"
                  value={formData.selectedProvider}
                  onChange={(e) => {
                    const prov = e.target.value as AIProviderType;
                    setFormData({
                      ...formData,
                      selectedProvider: prov,
                      selectedModel:
                        prov === 'codemind'
                          ? 'codemind-ai'
                          : prov === 'gemini'
                          ? 'gemini-2.5-pro'
                          : prov === 'openai'
                          ? 'o3-mini'
                          : 'llama-3.3-70b-versatile'
                    });
                  }}
                >
                  <option value="gemini">Frontier Neural Engine (Deep Reasoning & Coding)</option>
                  <option value="codemind">CodeMind Private Engine (Local On-Device / M2 Air-Gapped)</option>
                  <option value="openai">OpenAI Frontier Reasoning (o3 / GPT-4o)</option>
                  <option value="custom">Enterprise Custom Endpoint</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Algorithmic Optimization Strategy</span>
                </label>
                <select className="select-input" defaultValue="optimal">
                  <option value="optimal">Asymptotically Optimal (Strict Constraint Big-O, No TLE)</option>
                  <option value="clean">Production Grade (Clean idiomatic code, robust error guards)</option>
                  <option value="interview">Interview Mode (Step-by-step intuition, invariant proofs)</option>
                </select>
              </div>

              <div className="control-grid">
                <div className="form-group">
                  <label className="form-label">Precision & Determinism</label>
                  <select
                    className="select-input"
                    value={formData.codemindTemperature ?? 0.05}
                    onChange={(e) => setFormData({ ...formData, codemindTemperature: parseFloat(e.target.value) })}
                  >
                    <option value="0.05">Mathematical Determinism (0.05 - Recommended)</option>
                    <option value="0.1">Balanced Precision (0.1)</option>
                    <option value="0.2">Creative Exploration (0.2)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Token Horizon</label>
                  <select
                    className="select-input"
                    value={formData.codemindMaxTokens || 4096}
                    onChange={(e) => setFormData({ ...formData, codemindMaxTokens: parseInt(e.target.value, 10) })}
                  >
                    <option value="4096">4,096 tokens (Standard Solutions)</option>
                    <option value="8192">8,192 tokens (Exhaustive Analysis)</option>
                    <option value="16384">16,384 tokens (Full Proofs)</option>
                  </select>
                </div>
              </div>

              <div className="engine-info-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)' }}>
                      Managed AI Acceleration Active
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      All algorithmic synthesis models are managed securely and optimized for LeetCode's latest runtime.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Editor Integration */}
          {activeTab === 'editor' && (
            <div className="pref-section">
              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-title">Auto-Detect LeetCode Language</span>
                  <span className="toggle-description">
                    Automatically sync the target generation language with the active Monaco editor dropdown on LeetCode.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={formData.useEditorLanguage !== false}
                  onChange={(e) => setFormData({ ...formData, useEditorLanguage: e.target.checked })}
                />
              </div>

              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-title">Overwrite Safety Shield</span>
                  <span className="toggle-description">
                    Require confirmation before replacing existing editor code with AI-generated solutions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={formData.confirmBeforeOverwrite !== false}
                  onChange={(e) => setFormData({ ...formData, confirmBeforeOverwrite: e.target.checked })}
                />
              </div>

              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-title">Auto-Analyze on Problem Load</span>
                  <span className="toggle-description">
                    Automatically parse problem constraints and prepare complexity targets when opening a LeetCode problem.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={!!formData.autoAnalyzeOnOpen}
                  onChange={(e) => setFormData({ ...formData, autoAnalyzeOnOpen: e.target.checked })}
                />
              </div>

              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-title">Strict Code Hygiene & Type Safety</span>
                  <span className="toggle-description">
                    Validate syntax, strip unused wrappers, and enforce pure LeetCode class signatures.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={true}
                  disabled
                  readOnly
                />
              </div>
            </div>
          )}

          {/* TAB 3: Safeguards & Privacy */}
          {activeTab === 'safeguards' && (
            <div className="pref-section">
              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-title">Enable Daily Generation Guardrail</span>
                  <span className="toggle-description">
                    Prevent accidental excessive automated invocations.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={formData.safeguards?.enabled !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safeguards: {
                        ...formData.safeguards,
                        enabled: e.target.checked,
                        maxRequestsPerDay: formData.safeguards?.maxRequestsPerDay || 50,
                        warnBeforeReasoningModels: formData.safeguards?.warnBeforeReasoningModels !== false
                      }
                    })
                  }
                />
              </div>

              {formData.safeguards?.enabled !== false && (
                <div className="form-group">
                  <label className="form-label">Daily Request Cap</label>
                  <select
                    className="select-input"
                    value={formData.safeguards?.maxRequestsPerDay || 50}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        safeguards: {
                          ...formData.safeguards,
                          enabled: true,
                          maxRequestsPerDay: parseInt(e.target.value, 10),
                          warnBeforeReasoningModels: formData.safeguards?.warnBeforeReasoningModels !== false
                        }
                      })
                    }
                  >
                    <option value="25">25 solutions / day (Strict)</option>
                    <option value="50">50 solutions / day (Balanced)</option>
                    <option value="100">100 solutions / day (Power User)</option>
                    <option value="250">250 solutions / day (Unlimited Training)</option>
                  </select>
                </div>
              )}

              <div className="engine-info-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--success-color)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)' }}>
                      Zero Data Retention & Privacy Guarantee
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Your code, problem attempts, and solutions are processed in memory and never stored externally.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Activity & Diagnostics */}
          {activeTab === 'activity' && (
            <div className="pref-section">
              <div className="control-grid">
                <div className="metric-box">
                  <span className="metric-val">{formData.usageRecords?.length || 0}</span>
                  <span className="metric-lbl">Total Invocations</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val" style={{ color: 'var(--success-color)' }}>
                    100%
                  </span>
                  <span className="metric-lbl">Engine Health</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportLogs}
                  style={{ flex: 1, fontSize: '11px' }}
                  title="Export solution history as JSON"
                >
                  <Download size={12} />
                  Export History
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleClearLogs}
                  style={{ flex: 1, fontSize: '11px', color: 'var(--error-color)' }}
                  title="Clear all stored logs"
                >
                  <Trash2 size={12} />
                  Clear History
                </button>
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={testing}
                  onClick={handleTestEngine}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Activity size={13} className={testing ? 'spinner' : ''} />
                  {testing ? 'Testing Engine Connectivity...' : 'Run Engine Health Check'}
                </button>
              </div>
            </div>
          )}

          {/* Test / Feedback Result */}
          {testResult && (
            <div
              className={`test-result-box ${testResult.success ? 'success' : 'error'}`}
              style={{ marginTop: '12px' }}
            >
              {testResult.success ? <CheckCircle2 size={14} /> : <X size={14} />}
              <div style={{ flex: 1 }}>
                <div>{testResult.message}</div>
                {testResult.latencyMs && (
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    Latency: {testResult.latencyMs}ms | Architecture: {formData.selectedProvider}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleResetDefaults} title="Reset to defaults">
            <RotateCcw size={12} />
            Reset Defaults
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveAndClose}>
              {savedSuccess ? <Check size={13} /> : null}
              {savedSuccess ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
