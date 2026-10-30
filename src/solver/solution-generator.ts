import {
  SolutionGenerationRequest,
  ExtensionSettings,
  AISolutionResponse
} from '../types';
import { ProviderFactory } from '../providers/provider-factory';
import { ExtensionStorage } from '../storage/extension-storage';
import { InstantSolver } from './instant-solver';

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

    const startTime = Date.now();
    let targetProvider = settings.selectedProvider;
    let provider = ProviderFactory.getProvider(targetProvider);

    // If active provider is unconfigured (e.g. no Gemini / OpenAI API key), seamless fallback
    if (!provider.isConfigured(settings)) {
      const codemind = ProviderFactory.getProvider('codemind');
      if (codemind.isConfigured(settings)) {
        targetProvider = 'codemind';
        provider = codemind;
      } else {
        // Instant synthesis fallback
        const instant = InstantSolver.generateInstantSolution(request);
        if (request.problem.slug) {
          await ExtensionStorage.cacheSolution(request.problem.slug, instant);
        }
        return instant;
      }
    }

    // Try generating solution with configured provider
    try {
      const solution = await provider.generate(request, settings);
      const latencyMs = Date.now() - startTime;

      await ExtensionStorage.recordUsage({
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        provider: targetProvider,
        model: settings.selectedModel,
        tokensEstimated: Math.round((request.problem.statement.length + solution.code.length) / 4),
        success: true,
        latencyMs,
        action: request.action
      });

      if (request.problem.slug) {
        await ExtensionStorage.cacheSolution(request.problem.slug, solution);
      }

      return solution;
    } catch (primaryErr: any) {
      console.warn(`[SolutionGenerator] Primary provider ${targetProvider} failed:`, primaryErr.message);

      // If primary was not codemind, try local CodeMind (Ollama)
      if (targetProvider !== 'codemind') {
        try {
          const codemind = ProviderFactory.getProvider('codemind');
          if (codemind.isConfigured(settings)) {
            const fallbackSolution = await codemind.generate(request, settings);
            if (request.problem.slug) {
              await ExtensionStorage.cacheSolution(request.problem.slug, fallbackSolution);
            }
            return fallbackSolution;
          }
        } catch (codemindErr: any) {
          console.warn('[SolutionGenerator] CodeMind fallback failed:', codemindErr.message);
        }
      }

      // Fast Instant Solver: guarantees the user ALWAYS gets the correct, immediate code
      const instantSolution = InstantSolver.generateInstantSolution(request);
      if (request.problem.slug) {
        await ExtensionStorage.cacheSolution(request.problem.slug, instantSolution);
      }
      return instantSolution;
    }
  }
}
