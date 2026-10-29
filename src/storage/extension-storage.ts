import {
  ExtensionSettings,
  ImportedProblem,
  AISolutionResponse,
  UsageRecord,
  ProviderConnectionStatus
} from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  selectedProvider: 'gemini',
  selectedModel: 'gemini-4-argon',
  targetLanguage: 'python3',
  useEditorLanguage: true,
  confirmBeforeOverwrite: true,
  autoAnalyzeOnOpen: false,
  debugMode: false,

  localBackend: {
    enabled: false,
    baseUrl: 'http://localhost:3001'
  },

  safeguards: {
    enabled: true,
    maxRequestsPerDay: 50,
    warnBeforeReasoningModels: true
  },

  usageRecords: [],
  connectionStatus: {},

  // CodeMind AI Default Configuration (Local Ollama on MacBook Air M2)
  codemindEnabled: true,
  codemindEndpoint: 'http://127.0.0.1:11434',
  codemindModel: 'codemind-ai',
  codemindCustomModel: '',
  codemindTimeoutSeconds: 60,
  codemindMaxTokens: 4096,
  codemindTemperature: 0.2,

  geminiApiKey: '',
  geminiModel: 'gemini-4-argon',
  geminiCustomModel: '',

  openaiApiKey: '',
  openaiModel: 'o3-mini',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiCustomModel: '',

  customApiKey: '',
  customModel: 'llama-3.3-70b-versatile',
  customBaseUrl: 'http://localhost:11434/v1'
};

const SETTINGS_KEY = 'leetcode_copilot_settings';
const PROBLEMS_KEY = 'leetcode_copilot_imported_problems';
const SOLUTION_CACHE_KEY_PREFIX = 'leetcode_copilot_solution_';

export class ExtensionStorage {
  private static isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }

  static async getSettings(): Promise<ExtensionSettings> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([SETTINGS_KEY], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error reading storage:', chrome.runtime.lastError);
            resolve(DEFAULT_SETTINGS);
            return;
          }
          const stored = result[SETTINGS_KEY];
          const merged: ExtensionSettings = {
            ...DEFAULT_SETTINGS,
            ...(stored || {})
          };

          // Auto-migrate legacy 2.5 flash to gemini-4-argon / gemini-3.8-flash
          if (merged.selectedModel?.includes('2.5-flash')) {
            merged.selectedModel = 'gemini-4-argon';
          }
          if (merged.geminiModel?.includes('2.5-flash')) {
            merged.geminiModel = 'gemini-4-argon';
          }
          resolve(merged);
        });
      });
    }

    // Fallback for node/browser testing
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const merged: ExtensionSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        if (merged.selectedModel?.includes('2.5-flash')) {
          merged.selectedModel = 'gemini-4-argon';
        }
        if (merged.geminiModel?.includes('2.5-flash')) {
          merged.geminiModel = 'gemini-4-argon';
        }
        return merged;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };

    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [SETTINGS_KEY]: updated }, () => {
          resolve(updated);
        });
      });
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    return updated;
  }

  static async recordUsage(record: UsageRecord): Promise<void> {
    const settings = await this.getSettings();
    const records = [record, ...(settings.usageRecords || [])].slice(0, 100); // keep last 100
    await this.saveSettings({ usageRecords: records });
  }

  static async checkDailySpendingSafeguard(): Promise<{ allowed: boolean; reason?: string; count: number; max: number }> {
    const settings = await this.getSettings();
    const safeguards = settings.safeguards || DEFAULT_SETTINGS.safeguards;

    if (!safeguards.enabled) {
      return { allowed: true, count: 0, max: 0 };
    }

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const dailyRequests = (settings.usageRecords || []).filter(
      r => r.timestamp > oneDayAgo && r.success
    );

    const count = dailyRequests.length;
    const max = safeguards.maxRequestsPerDay || 50;

    if (count >= max) {
      return {
        allowed: false,
        reason: `Daily spending safeguard reached: ${count}/${max} requests in the last 24h. You can increase or toggle this limit in Settings.`,
        count,
        max
      };
    }

    return { allowed: true, count, max };
  }

  static async setConnectionStatus(provider: string, status: ProviderConnectionStatus): Promise<void> {
    const settings = await this.getSettings();
    const updatedStatus = {
      ...(settings.connectionStatus || {}),
      [provider]: status
    };
    await this.saveSettings({ connectionStatus: updatedStatus });
  }

  static async getImportedProblems(): Promise<ImportedProblem[]> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([PROBLEMS_KEY], (result) => {
          resolve((result[PROBLEMS_KEY] as ImportedProblem[]) || []);
        });
      });
    }

    try {
      const stored = localStorage.getItem(PROBLEMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static async saveImportedProblems(problems: ImportedProblem[]): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [PROBLEMS_KEY]: problems }, () => resolve());
      });
    }

    try {
      localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  static async getCachedSolution(slug: string): Promise<AISolutionResponse | null> {
    const key = `${SOLUTION_CACHE_KEY_PREFIX}${slug}`;
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve((result[key] as AISolutionResponse) || null);
        });
      });
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  static async cacheSolution(slug: string, solution: AISolutionResponse): Promise<void> {
    const key = `${SOLUTION_CACHE_KEY_PREFIX}${slug}`;
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: solution }, () => resolve());
      });
    }

    try {
      localStorage.setItem(key, JSON.stringify(solution));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}
