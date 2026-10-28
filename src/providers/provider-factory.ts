import { IAIProvider, AIProviderType } from '../types';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { CustomProvider } from './custom-provider';

export class ProviderFactory {
  private static providers: Map<AIProviderType, IAIProvider> = new Map<AIProviderType, IAIProvider>([
    ['gemini', new GeminiProvider()],
    ['openai', new OpenAIProvider()],
    ['custom', new CustomProvider()]
  ]);

  static getProvider(type: AIProviderType): IAIProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Unsupported AI Provider: ${type}`);
    }
    return provider;
  }

  static getAllProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }
}
