import {
  IAIProvider,
  ExtensionSettings,
  ModelOption,
  ProviderConnectionTestResult,
  SolutionGenerationRequest,
  AISolutionResponse
} from '../types';
import { PromptBuilder } from '../solver/prompt-builder';
import { ResponseValidator } from '../solver/response-validator';

/**
 * CodeMindProvider
 *
 * First-class AI Provider for running local algorithmic coding models via Ollama
 * on Apple Silicon (M2 8GB) or custom fine-tuned GGUF/LoRA checkpoints.
 */
export class CodeMindProvider implements IAIProvider {
  readonly id = 'codemind';
  readonly name = 'CodeMind AI';

  public static DEFAULT_MODELS: ModelOption[] = [
    {
      id: 'codemind-ai',
      name: 'CodeMind AI (Local / Custom Checkpoint)',
      description: 'Your local fine-tuned or customized coding model alias in Ollama',
      isDefault: true,
      isLocal: true,
      isCustomTrained: true
    },
    {
      id: 'qwen2.5-coder:7b',
      name: 'Qwen 2.5 Coder 7B',
      description: 'Top-tier code reasoning optimized for 8GB M2 Macs (~4.7GB RAM)',
      isLocal: true
    },
    {
      id: 'qwen2.5-coder:1.5b',
      name: 'Qwen 2.5 Coder 1.5B',
      description: 'Ultra-lightweight and fast local coding model (~1.3GB RAM)',
      isLocal: true
    },
    {
      id: 'deepseek-coder:6.7b',
      name: 'DeepSeek Coder 6.7B',
      description: 'Specialized Python & C++ algorithmic reasoning (~4.5GB RAM)',
      isLocal: true
    },
    {
      id: 'codellama:7b',
      name: 'CodeLlama 7B',
      description: 'Meta CodeLlama 7B parameter base model',
      isLocal: true
    }
  ];

  isConfigured(settings: ExtensionSettings): boolean {
    return (
      settings.codemindEnabled !== false &&
      !!settings.codemindEndpoint &&
      settings.codemindEndpoint.trim().length > 0
    );
  }

  private getEndpoint(settings: ExtensionSettings): string {
    return (settings.codemindEndpoint || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  }

  private getModel(settings: ExtensionSettings): string {
    if (settings.codemindCustomModel?.trim()) {
      return settings.codemindCustomModel.trim();
    }
    if (settings.selectedProvider === 'codemind' && settings.selectedModel?.trim()) {
      return settings.selectedModel.trim();
    }
    return settings.codemindModel || 'codemind-ai';
  }

  /**
   * Dynamically query Ollama's local catalog (/api/tags) to list installed models
   */
  async listModels(settings: ExtensionSettings): Promise<ModelOption[]> {
    if (!this.isConfigured(settings)) {
      return CodeMindProvider.DEFAULT_MODELS;
    }

    try {
      const endpoint = this.getEndpoint(settings);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(`${endpoint}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          const installedNames = new Set(data.models.map((m: any) => m.name || m.model));

          const dynamicList: ModelOption[] = data.models.map((m: any) => {
            const modelName = m.name || m.model;
            const isCodeMindAlias = modelName.toLowerCase().includes('codemind');
            return {
              id: modelName,
              name: isCodeMindAlias
                ? `CodeMind AI (${modelName})`
                : `${modelName} (Installed Locally)`,
              description: `Size: ${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB · Family: ${
                m.details?.family || 'local'
              }`,
              isLocal: true,
              isCustomTrained: isCodeMindAlias
            };
          });

          // Always ensure the user's configured model or default 'codemind-ai' is present
          const activeModel = this.getModel(settings);
          if (!installedNames.has(activeModel)) {
            dynamicList.unshift({
              id: activeModel,
              name: `${activeModel} (Configured Target)`,
              description: 'Model identifier specified in extension settings',
              isDefault: true,
              isLocal: true,
              isCustomTrained: activeModel.toLowerCase().includes('codemind')
            });
          }

          return dynamicList;
        }
      }
    } catch {
      // Ollama not running or unreachable: return default curated recommendations
    }

    return CodeMindProvider.DEFAULT_MODELS;
  }

  /**
   * Test connection to local Ollama runtime and verify active model status
   */
  async testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult> {
    if (!this.isConfigured(settings)) {
      return {
        success: false,
        message: 'CodeMind AI is disabled or local endpoint is empty (default: http://127.0.0.1:11434)'
      };
    }

    const endpoint = this.getEndpoint(settings);
    const targetModel = this.getModel(settings);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(`${endpoint}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!resp.ok) {
        if (resp.status === 403) {
          return {
            success: false,
            message: `Ollama is running, but blocked browser extension access (HTTP 403 Forbidden).`,
            instructionHint: `To allow browser extensions to connect to Ollama on macOS:\n1. Run in Terminal: launchctl setenv OLLAMA_ORIGINS "*"\n2. Restart the Ollama app (Quit from menu bar, then re-open).\n(Or start in Terminal via: OLLAMA_ORIGINS="*" ollama serve)`,
            latencyMs
          };
        }
        return {
          success: false,
          message: `Local endpoint responded with HTTP ${resp.status}`,
          latencyMs
        };
      }

      const data = await resp.json();
      const installedModels: string[] = Array.isArray(data.models)
        ? data.models.map((m: any) => m.name || m.model)
        : [];

      // Check if target model is installed
      const hasTargetModel = installedModels.some(
        (name) => name === targetModel || name.startsWith(`${targetModel}:`)
      );

      if (hasTargetModel) {
        return {
          success: true,
          message: `Online! CodeMind AI connected to Ollama (${latencyMs}ms). Model "${targetModel}" is installed and ready.`,
          testedModel: targetModel,
          availableModels: installedModels,
          isLocalOllama: true,
          latencyMs
        };
      }

      // Ollama is online, but target model is not pulled yet
      return {
        success: true,
        message: `Ollama is running (${latencyMs}ms), but model "${targetModel}" was not found in local models: [${installedModels.join(', ') || 'none'}].`,
        instructionHint: `Run in your Mac Terminal:\n  ollama run qwen2.5-coder:7b\nor create the CodeMind alias:\n  ollama cp qwen2.5-coder:7b ${targetModel}`,
        testedModel: targetModel,
        availableModels: installedModels,
        isLocalOllama: true,
        latencyMs
      };
    } catch (e: any) {
      const latencyMs = Date.now() - startTime;
      const isConnectionRefused =
        e.name === 'AbortError' ||
        e.message?.includes('Failed to fetch') ||
        e.message?.includes('NetworkError') ||
        e.message?.includes('ECONNREFUSED');

      if (isConnectionRefused) {
        return {
          success: false,
          message: `Could not reach local Ollama service at ${endpoint}.`,
          instructionHint: `To start your local model on macOS:\n1. Install: brew install ollama\n2. Start server: ollama serve\n3. Run model: ollama run qwen2.5-coder:7b`,
          isLocalOllama: false,
          latencyMs
        };
      }

      return {
        success: false,
        message: `Connection test error: ${e.message}`,
        latencyMs
      };
    }
  }

  /**
   * Generate LeetCode solution using local Ollama model with structured output
   */
  async generate(req: SolutionGenerationRequest, settings: ExtensionSettings): Promise<AISolutionResponse> {
    if (!this.isConfigured(settings)) {
      throw new Error(
        'CodeMind AI is not enabled or endpoint is missing. Please enable it in Settings.'
      );
    }

    const endpoint = this.getEndpoint(settings);
    const model = this.getModel(settings);
    const timeoutSec = settings.codemindTimeoutSeconds || 60;
    const maxTokens = settings.codemindMaxTokens || 4096;
    const temperature = settings.codemindTemperature ?? 0.2;

    const { systemInstruction, userPrompt } = PromptBuilder.buildPrompt(req);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

    try {
      // Use Ollama's native /api/chat with format: "json" for strict JSON output enforcement
      const resp = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          format: 'json',
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        if (resp.status === 404) {
          throw new Error(
            `Model "${model}" was not found in your local Ollama library. Run "ollama pull qwen2.5-coder:7b" or check the model tag in Settings.`
          );
        }
        if (resp.status === 403) {
          throw new Error(
            `Ollama blocked browser extension access (HTTP 403 Forbidden). On macOS, allow browser extension access by running: "launchctl setenv OLLAMA_ORIGINS '*'" in Terminal and restarting the Ollama app (or run: "OLLAMA_ORIGINS='*' ollama serve").`
          );
        }
        const errorText = await resp.text();
        throw new Error(`CodeMind AI local endpoint returned HTTP ${resp.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await resp.json();
      const content = data.message?.content;

      if (!content || !content.trim()) {
        throw new Error('CodeMind AI returned an empty response. Verify model context length and prompt.');
      }

      const validation = ResponseValidator.validate(content, req.targetLanguage);
      if (!validation.isValid || !validation.sanitizedResponse) {
        throw new Error(`Failed to parse CodeMind AI output: ${validation.errors.join('; ')}`);
      }

      return validation.sanitizedResponse;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error(
          `CodeMind AI generation timed out after ${timeoutSec}s. For faster execution on 8GB M2 Mac, try "qwen2.5-coder:7b" or "qwen2.5-coder:1.5b", or increase timeout in Settings.`
        );
      }

      if (
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('ECONNREFUSED')
      ) {
        throw new Error(
          `Cannot reach CodeMind AI at ${endpoint}. Please ensure Ollama is running: execute "ollama serve" in Terminal.`
        );
      }

      throw err;
    }
  }
}
