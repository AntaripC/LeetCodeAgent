import React from 'react';
import { Sparkles, Bot, Check } from 'lucide-react';
import { ExtensionSettings, AIProviderType } from '../../types';

interface ModelSelectionCardsProps {
  settings: ExtensionSettings;
  onProviderChange: (provider: AIProviderType) => void;
  onOpenSettings: () => void;
}

export const ModelSelectionCards: React.FC<ModelSelectionCardsProps> = ({
  settings,
  onProviderChange,
  onOpenSettings
}) => {
  const isGeminiSelected = settings.selectedProvider === 'gemini';
  const isSecondarySelected = settings.selectedProvider === 'openai' || settings.selectedProvider === 'codemind';

  return (
    <div className="section-block">
      <div className="section-header-title">MODEL SELECTION</div>
      <div className="model-cards-grid">
        {/* Card 1: Gemini 4 Argon */}
        <div
          className={`model-card ${isGeminiSelected ? 'selected' : ''}`}
          onClick={() => onProviderChange('gemini')}
          role="button"
          tabIndex={0}
        >
          <div className="model-icon-box gemini-icon-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="gemini-sparkle-svg"
            >
              <path
                d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
                fill="url(#geminiGradient)"
              />
              <defs>
                <linearGradient id="geminiGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="0.5" stopColor="#818cf8" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="model-info">
            <div className="model-name-row">
              <span className="model-name">Gemini Flash Turbo</span>
              {isGeminiSelected && <span className="selected-pill">Selected</span>}
            </div>
            <div className="model-stats">
              <span>Speed: &lt;1.5s</span>
              <span>Logic: 99%</span>
            </div>
          </div>
        </div>

        {/* Card 2: GPT-6 Astra / CodeMind AI */}
        <div
          className={`model-card ${isSecondarySelected ? 'selected' : ''}`}
          onClick={() => onProviderChange(settings.codemindEnabled ? 'codemind' : 'openai')}
          role="button"
          tabIndex={0}
        >
          <div className="model-icon-box astra-icon-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>

          <div className="model-info">
            <div className="model-name-row">
              <span className="model-name">
                {settings.selectedProvider === 'codemind' ? 'CodeMind Pro' : 'GPT-6 Astra'}
              </span>
              {isSecondarySelected && <span className="selected-pill">Selected</span>}
            </div>
            <div className="model-stats">
              <span>Accuracy: 99%</span>
              <span>Reasoning: 98%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
