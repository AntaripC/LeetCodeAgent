import { AISolutionResponse, SolutionGenerationRequest } from './solution';

export type AIProviderType = 'gemini' | 'openai' | 'codemind' | 'custom' | 'local_backend';

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isFrontierReasoning?: boolean;
  isLocal?: boolean;
  isCustomTrained?: boolean;
}

export interface SpendingSafeguards {
  enabled: boolean;
  maxRequestsPerDay: number;
  warnBeforeReasoningModels: boolean;
}

export interface UsageRecord {
  id: string;
  timestamp: number;
  provider: AIProviderType;
  model: string;
  tokensEstimated: number;
  success: boolean;
  latencyMs: number;
  action: string;
  error?: string;
}

export interface LocalBackendConfig {
  enabled: boolean;
  baseUrl: string;
}

export interface ProviderConnectionStatus {
  connected: boolean;
  testedModel?: string;
  lastTested?: number;
  latencyMs?: number;
  message?: string;
}

export interface ExtensionSettings {
  selectedProvider: AIProviderType;
  selectedModel: string;
  targetLanguage: string;
  useEditorLanguage: boolean;
  confirmBeforeOverwrite: boolean;
  autoAnalyzeOnOpen: boolean;
  debugMode: boolean;

  // Local Backend Proxy (keeps API keys completely out of browser)
  localBackend: LocalBackendConfig;

  // Configurable Spending Safeguards
  safeguards: SpendingSafeguards;

  // Usage & Error Tracking Records
  usageRecords: UsageRecord[];

  // Verified Connection Statuses
  connectionStatus: Record<string, ProviderConnectionStatus>;

  // CodeMind AI Settings (Local Ollama / Fine-Tuned Model)
  codemindEnabled: boolean;
  codemindEndpoint: string;
  codemindModel: string;
  codemindCustomModel?: string;
  codemindTimeoutSeconds: number;
  codemindMaxTokens: number;
  codemindTemperature: number;

  // Gemini Settings
  geminiApiKey: string;
  geminiModel: string;
  geminiCustomModel?: string;

  // OpenAI Settings
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseUrl?: string;
  openaiCustomModel?: string;

  // Custom / Compatible Settings
  customApiKey: string;
  customModel: string;
  customBaseUrl?: string;
}

export interface ProviderConnectionTestResult {
  success: boolean;
  message: string;
  availableModels?: string[];
  latencyMs?: number;
  testedModel?: string;
  isLocalOllama?: boolean;
  instructionHint?: string;
}

export interface IAIProvider {
  id: AIProviderType;
  name: string;
  isConfigured(settings: ExtensionSettings): boolean;
  listModels(settings: ExtensionSettings): Promise<ModelOption[]>;
  testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult>;
  generate(request: SolutionGenerationRequest, settings: ExtensionSettings): Promise<AISolutionResponse>;
}
