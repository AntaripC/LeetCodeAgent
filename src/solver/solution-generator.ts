import {
  SolutionGenerationRequest,
  ExtensionSettings,
  AISolutionResponse
} from '../types';
import { ProviderFactory } from '../providers/provider-factory';
import { ExtensionStorage } from '../storage/extension-storage';

export class SolutionGenerator {
  static async generateSolution(
    request: SolutionGenerationRequest,
    settings: ExtensionSettings
  ): Promise<AISolutionResponse> {
    // 1. Check Spending Safeguards
    const safeguardCheck = await ExtensionStorage.checkDailySpendingSafeguard();
    if (!safeguardCheck.allowed) {
      throw new Error(safeguardCheck.reason || 'Daily spending safeguard reached.');
    }

    const provider = ProviderFactory.getProvider(settings.selectedProvider);

    if (!provider.isConfigured(settings)) {
      throw new Error(`Provider "${provider.name}" is not configured. Please add your API key in extension settings or enable the Local Backend Proxy.`);
    }

    let lastError: any = null;
    const maxRetries = 2;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const solution = await provider.generate(request, settings);
        const latencyMs = Date.now() - startTime;

        // Record successful usage
        await ExtensionStorage.recordUsage({
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          provider: settings.selectedProvider,
          model: settings.selectedModel,
          tokensEstimated: Math.round((request.problem.statement.length + solution.code.length) / 4),
          success: true,
          latencyMs,
          action: request.action
        });

        // Cache the solution for this problem slug
        if (request.problem.slug) {
          await ExtensionStorage.cacheSolution(request.problem.slug, solution);
        }

        return solution;
      } catch (err: any) {
        lastError = err;

        // Don't retry if it's an authentication, 404 model not found, or configuration error
        const msg = String(err.message || '').toLowerCase();
        if (
          msg.includes('auth') ||
          msg.includes('api key') ||
          msg.includes('quota') ||
          msg.includes('401') ||
          msg.includes('403') ||
          msg.includes('404') ||
          msg.includes('not found') ||
          msg.includes('does not exist')
        ) {
          await ExtensionStorage.recordUsage({
            id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            provider: settings.selectedProvider,
            model: settings.selectedModel,
            tokensEstimated: 0,
            success: false,
            latencyMs: Date.now() - startTime,
            action: request.action,
            error: err.message
          });
          throw err;
        }

        if (attempt < maxRetries) {
          // Bounded backoff wait
          await new Promise(r => setTimeout(r, 1200 * attempt));
        }
      }
    }

    await ExtensionStorage.recordUsage({
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      provider: settings.selectedProvider,
      model: settings.selectedModel,
      tokensEstimated: 0,
      success: false,
      latencyMs: Date.now() - startTime,
      action: request.action,
      error: lastError?.message || 'Failed after retries'
    });

    throw lastError || new Error('Failed to generate solution after multiple attempts');
  }
}
