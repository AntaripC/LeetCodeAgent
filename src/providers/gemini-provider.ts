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

export class GeminiProvider implements IAIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';

  private static DEFAULT_MODELS: ModelOption[] = [
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Turbo (Ultra Fast <1.5s)', isDefault: true },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (High Speed & Efficiency)' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Balanced Reasoning)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High Speed & Efficiency)' },
    { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Frontier Coding)', isFrontierReasoning: true }
  ];

  resolveModel(settings: ExtensionSettings): string {
    // Priority: custom typed model > selected model > geminiModel > default
    let model = (settings.geminiCustomModel?.trim() || settings.selectedModel || settings.geminiModel || 'gemini-flash-lite-latest').trim();
    model = model.replace(/^models\//, '');
    if (!model || model.includes('2.5-flash') || model.includes('2.5-pro') || model.includes('1.5-') || model.includes('argon')) {
      model = 'gemini-flash-lite-latest';
    }
    return model;
  }

  isConfigured(settings: ExtensionSettings): boolean {
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      return true; // Configured through local server proxy
    }
    return !!settings.geminiApiKey && settings.geminiApiKey.trim().length > 0;
  }

  async listModels(settings: ExtensionSettings): Promise<ModelOption[]> {
    if (!this.isConfigured(settings)) {
      return GeminiProvider.DEFAULT_MODELS;
    }

    try {
      const apiKey = settings.geminiApiKey.trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return GeminiProvider.DEFAULT_MODELS;
      }

      const data = await resp.json();
      if (Array.isArray(data.models)) {
        const models: ModelOption[] = data.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => {
            const shortId = m.name.replace(/^models\//, '');
            return {
              id: shortId,
              name: m.displayName || shortId,
              description: m.description,
              isFrontierReasoning: shortId.includes('argon') || shortId.includes('pro')
            };
          })
          .filter((m: ModelOption) => !m.id.includes('2.5-flash') && !m.id.includes('2.5-pro') && !m.id.includes('1.5-'));

        // Prioritize ultra-fast models first
        const priorityOrder = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
        models.sort((a, b) => {
          const aIdx = priorityOrder.indexOf(a.id);
          const bIdx = priorityOrder.indexOf(b.id);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return 0;
        });

        // Ensure gemini-flash-lite-latest is present as default
        if (!models.some(m => m.id === 'gemini-flash-lite-latest')) {
          models.unshift({
            id: 'gemini-flash-lite-latest',
            name: 'Gemini Flash-Lite Turbo (Ultra Fast <1.5s)',
            isDefault: true
          });
        }

        if (models.length > 0) {
          return models;
        }
      }
    } catch {
      // Fallback to default catalog
    }

    return GeminiProvider.DEFAULT_MODELS;
  }

  async testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult> {
    if (!this.isConfigured(settings)) {
      return {
        success: false,
        message: 'Google Gemini API key is not configured.'
      };
    }

    // Proxy through local backend if enabled
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      try {
        const resp = await fetch(`${settings.localBackend.baseUrl.replace(/\/+$/, '')}/api/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'gemini',
            model: this.resolveModel(settings),
            apiKeyOverride: settings.geminiApiKey || undefined
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
      const apiKey = settings.geminiApiKey.trim();
      const cleanModel = this.resolveModel(settings);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with: {"status": "ok"}' }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
            responseMimeType: 'application/json'
          }
        }),
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

        if (resp.status === 404) {
          message = `Model "${cleanModel}" is not available on this Google account or project. Switch to Gemini 3.8 Flash or check your API key permissions.`;
        } else if (resp.status === 400 || resp.status === 403) {
          message = `Authentication Failed (${resp.status}): Check your Gemini API key. Details: ${message}`;
        } else if (resp.status === 429) {
          message = `Quota / Rate limit reached (HTTP 429). Please wait a moment.`;
        }

        return { success: false, message, latencyMs, testedModel: cleanModel };
      }

      const availableModels = (await this.listModels(settings)).map(m => m.id);

      return {
        success: true,
        message: `Successfully connected to Gemini (${cleanModel}) in ${latencyMs}ms!`,
        availableModels,
        latencyMs,
        testedModel: cleanModel
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
      throw new Error('Google Gemini API key is missing. Please set your API key in extension settings or enable the Local Backend Proxy.');
    }

    const model = this.resolveModel(settings);

    // If using Local Backend Proxy, route through it
    if (settings.localBackend?.enabled && settings.localBackend.baseUrl) {
      const resp = await fetch(`${settings.localBackend.baseUrl.replace(/\/+$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          model,
          request: req,
          apiKeyOverride: settings.geminiApiKey || undefined
        })
      });

      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || `Local backend error (status ${resp.status})`);
      }
      return json.data;
    }

    const apiKey = settings.geminiApiKey.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const { systemInstruction, userPrompt } = PromptBuilder.buildPrompt(req);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorText = await resp.text();
        let errorMsg = `Gemini API returned status ${resp.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          }
        } catch {}

        // If requested model was 404 or 429 quota exhausted, try ultra-fast gemini-flash-lite-latest
        if (resp.status === 404 || resp.status === 429) {
          const fallbackModel = model === 'gemini-flash-lite-latest' ? 'gemini-3.5-flash-lite' : 'gemini-flash-lite-latest';
          try {
            const fbUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const fbResp = await fetch(fbUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: 'application/json' }
              })
            });
            if (fbResp.ok) {
              const fbData = await fbResp.json();
              const fbText = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (fbText) {
                const validation = ResponseValidator.validate(fbText, req.targetLanguage);
                if (validation.isValid && validation.sanitizedResponse) {
                  return validation.sanitizedResponse;
                }
              }
            }
          } catch {}
          if (resp.status === 429) {
            throw new Error(`Gemini rate limit exceeded. Please wait a minute and retry. (${errorMsg})`);
          }
          throw new Error(`Model "${model}" was not found or is unavailable to your Google AI account. Switched to Gemini Flash-Lite. (${errorMsg})`);
        } else if (resp.status === 400 || resp.status === 403) {
          throw new Error(`Gemini authorization error: ${errorMsg}`);
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error('Gemini did not return any candidates or response text');
      }

      const validation = ResponseValidator.validate(candidateText, req.targetLanguage);
      if (!validation.isValid || !validation.sanitizedResponse) {
        throw new Error(`Failed to validate AI output: ${validation.errors.join('; ')}`);
      }

      return validation.sanitizedResponse;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Gemini generation request timed out after 45 seconds. Please check your connection and try again.');
      }
      throw err;
    }
  }
}
