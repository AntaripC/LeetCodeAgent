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

export class CustomProvider implements IAIProvider {
  readonly id = 'custom';
  readonly name = 'Custom / OpenAI Compatible';

  private static DEFAULT_MODELS: ModelOption[] = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', isDefault: true },
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B' },
    { id: 'mistral-large-latest', name: 'Mistral Large' }
  ];

  isConfigured(settings: ExtensionSettings): boolean {
    return !!settings.customBaseUrl && settings.customBaseUrl.trim().length > 0;
  }

  private getBaseUrl(settings: ExtensionSettings): string {
    return (settings.customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
  }

  async listModels(settings: ExtensionSettings): Promise<ModelOption[]> {
    if (!this.isConfigured(settings)) {
      return CustomProvider.DEFAULT_MODELS;
    }

    try {
      const baseUrl = this.getBaseUrl(settings);
      const headers: Record<string, string> = {};
      if (settings.customApiKey?.trim()) {
        headers['Authorization'] = `Bearer ${settings.customApiKey.trim()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(`${baseUrl}/models`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];
        if (list.length > 0) {
          return list.map((m: any) => ({
            id: m.id || m.name,
            name: m.id || m.name
          }));
        }
      }
    } catch {
      // Fallback
    }

    return CustomProvider.DEFAULT_MODELS;
  }

  async testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult> {
    if (!this.isConfigured(settings)) {
      return {
        success: false,
        message: 'Custom base URL is not configured (e.g. http://localhost:11434/v1)'
      };
    }

    const startTime = Date.now();
    try {
      const baseUrl = this.getBaseUrl(settings);
      const headers: Record<string, string> = {};
      if (settings.customApiKey?.trim()) {
        headers['Authorization'] = `Bearer ${settings.customApiKey.trim()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${baseUrl}/models`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!resp.ok) {
        return {
          success: false,
          message: `Custom endpoint responded with status ${resp.status}`,
          latencyMs
        };
      }

      const models = await this.listModels(settings);

      return {
        success: true,
        message: `Successfully connected to endpoint! Found ${models.length} model(s).`,
        availableModels: models.map(m => m.id),
        latencyMs
      };
    } catch (e: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        message: `Cannot reach custom endpoint: ${e.message}`,
        latencyMs
      };
    }
  }

  async generate(req: SolutionGenerationRequest, settings: ExtensionSettings): Promise<AISolutionResponse> {
    if (!this.isConfigured(settings)) {
      throw new Error('Custom endpoint Base URL is missing in extension settings.');
    }

    const baseUrl = this.getBaseUrl(settings);
    const model = settings.customModel || 'llama-3.3-70b-versatile';
    const { systemInstruction, userPrompt } = PromptBuilder.buildPrompt(req);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (settings.customApiKey?.trim()) {
      headers['Authorization'] = `Bearer ${settings.customApiKey.trim()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Custom endpoint error (status ${resp.status}): ${errorText.substring(0, 200)}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Custom endpoint returned empty content');
      }

      const validation = ResponseValidator.validate(content, req.targetLanguage);
      if (!validation.isValid || !validation.sanitizedResponse) {
        throw new Error(`Failed to validate AI output: ${validation.errors.join('; ')}`);
      }

      return validation.sanitizedResponse;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Custom provider request timed out after 50 seconds.');
      }
      throw err;
    }
  }
}
