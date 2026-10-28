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

export class OpenAIProvider implements IAIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  private static DEFAULT_MODELS: ModelOption[] = [
    { id: 'o3-mini', name: 'o3-mini (Frontier Competitive Programming & Reasoning)', isDefault: true, isFrontierReasoning: true },
    { id: 'o1', name: 'o1 (Deep Reasoning)', isFrontierReasoning: true },
    { id: 'gpt-4o', name: 'GPT-4o (High Intelligence & Multimodal)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Efficient)' },
    { id: 'gpt-6-astra', name: 'GPT-6 Astra (Frontier Coding Alias)', isFrontierReasoning: true },
    { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol (Next-Gen Deep Reasoning)', isFrontierReasoning: true }
  ];

  resolveModel(settings: ExtensionSettings): string {
    return (
      settings.openaiCustomModel?.trim() ||
      settings.selectedModel?.trim() ||
      settings.openaiModel?.trim() ||
      'o3-mini'
    );
  }

  isConfigured(settings: ExtensionSettings): boolean {
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      return true;
    }
    return !!settings.openaiApiKey && settings.openaiApiKey.trim().length > 0;
  }

  private getBaseUrl(settings: ExtensionSettings): string {
    return (settings.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  async listModels(settings: ExtensionSettings): Promise<ModelOption[]> {
    if (!this.isConfigured(settings)) {
      return OpenAIProvider.DEFAULT_MODELS;
    }

    try {
      const apiKey = settings.openaiApiKey.trim();
      const baseUrl = this.getBaseUrl(settings);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return OpenAIProvider.DEFAULT_MODELS;
      }

      const data = await resp.json();
      if (Array.isArray(data.data)) {
        const relevantModels: ModelOption[] = data.data
          .filter((m: any) => {
            const id = m.id.toLowerCase();
            return id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('astra') || id.includes('sol');
          })
          .map((m: any) => ({
            id: m.id,
            name: m.id,
            isFrontierReasoning: m.id.includes('6') || m.id.includes('o1') || m.id.includes('o3')
          }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id));

        // Ensure gpt-6-astra and gpt-6.1-sol are present in list
        if (!relevantModels.some(m => m.id === 'gpt-6-astra')) {
          relevantModels.unshift({
            id: 'gpt-6-astra',
            name: 'GPT-6 Astra (Latest Frontier Coding & Intelligence)',
            isDefault: true,
            isFrontierReasoning: true
          });
        }
        if (!relevantModels.some(m => m.id === 'gpt-6.1-sol')) {
          relevantModels.splice(1, 0, {
            id: 'gpt-6.1-sol',
            name: 'GPT-6.1 Sol (Next-Gen Deep Reasoning)',
            isFrontierReasoning: true
          });
        }

        if (relevantModels.length > 0) {
          return relevantModels;
        }
      }
    } catch {
      // Fallback to default models
    }

    return OpenAIProvider.DEFAULT_MODELS;
  }

  async testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult> {
    if (!this.isConfigured(settings)) {
      return {
        success: false,
        message: 'OpenAI API key is not configured.'
      };
    }

    // Proxy through local backend if enabled
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      try {
        const resp = await fetch(`${settings.localBackend.baseUrl.replace(/\/+$/, '')}/api/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'openai',
            model: this.resolveModel(settings),
            apiKeyOverride: settings.openaiApiKey || undefined
          })
        });
        const result = await resp.json();
        return result;
      } catch (e: any) {
        return {
          success: false,
          message: `Local backend proxy unreachable at ${settings.localBackend.baseUrl}: ${e.message}`
        };
      }
    }

    const startTime = Date.now();
    try {
      const apiKey = settings.openaiApiKey.trim();
      const baseUrl = this.getBaseUrl(settings);
      const model = this.resolveModel(settings);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!resp.ok) {
        const errorText = await resp.text();
        let message = `API request failed with status ${resp.status}`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error?.message) {
            message = errJson.error.message;
          }
        } catch {}

        if (resp.status === 401) {
          message = 'Authentication Failed: Invalid OpenAI API key.';
        } else if (resp.status === 429) {
          message = 'Quota or rate limit reached (HTTP 429). Please check your OpenAI billing/credits.';
        }

        return { success: false, message, latencyMs, testedModel: model };
      }

      const availableModels = (await this.listModels(settings)).map(m => m.id);

      return {
        success: true,
        message: `Connected to OpenAI (${model}) successfully in ${latencyMs}ms!`,
        availableModels,
        latencyMs,
        testedModel: model
      };
    } catch (e: any) {
      const latencyMs = Date.now() - startTime;
      if (e.name === 'AbortError') {
        return { success: false, message: 'Connection test timed out after 12s', latencyMs };
      }
      return { success: false, message: `Connection error: ${e.message}`, latencyMs };
    }
  }

  async generate(req: SolutionGenerationRequest, settings: ExtensionSettings): Promise<AISolutionResponse> {
    if (!this.isConfigured(settings)) {
      throw new Error('OpenAI API key is missing. Please set your API key in extension settings or enable Local Backend Proxy.');
    }

    const model = this.resolveModel(settings);

    // Route through local backend if configured
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      const resp = await fetch(`${settings.localBackend.baseUrl.replace(/\/+$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai',
          model,
          request: req,
          apiKeyOverride: settings.openaiApiKey || undefined
        })
      });

      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || `Local backend error (status ${resp.status})`);
      }
      return json.data;
    }

    const apiKey = settings.openaiApiKey.trim();
    const baseUrl = this.getBaseUrl(settings);
    const { systemInstruction, userPrompt } = PromptBuilder.buildPrompt(req);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    // Frontier reasoning models (o1, o3, sol) handle temperature differently
    const isReasoningModel = model.startsWith('o1') || model.startsWith('o3') || model.includes('sol');

    const bodyPayload: any = {
      model,
      messages: [
        { role: isReasoningModel ? 'developer' : 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ]
    };

    if (!isReasoningModel) {
      bodyPayload.temperature = 0.1;
      bodyPayload.response_format = { type: 'json_object' };
    }

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorText = await resp.text();
        let errorMsg = `OpenAI API returned status ${resp.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          }
        } catch {}

        if (resp.status === 404) {
          throw new Error(`Model "${model}" does not exist or your OpenAI account tier does not have access to it. Try selecting "GPT-4o Mini" or verify model access in Settings. (${errorMsg})`);
        } else if (resp.status === 429) {
          throw new Error(`OpenAI rate limit or quota exceeded: ${errorMsg}`);
        } else if (resp.status === 401) {
          throw new Error(`OpenAI authentication failed: ${errorMsg}`);
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('OpenAI returned an empty response choice');
      }

      const validation = ResponseValidator.validate(content, req.targetLanguage);
      if (!validation.isValid || !validation.sanitizedResponse) {
        throw new Error(`Failed to validate AI output: ${validation.errors.join('; ')}`);
      }

      return validation.sanitizedResponse;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('OpenAI generation request timed out after 45 seconds.');
      }
      throw err;
    }
  }
}
