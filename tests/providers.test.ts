import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderFactory } from '../src/providers/provider-factory';
import { GeminiProvider } from '../src/providers/gemini-provider';
import { OpenAIProvider } from '../src/providers/openai-provider';
import { CodeMindProvider } from '../src/providers/codemind-provider';
import { CustomProvider } from '../src/providers/custom-provider';
import { DEFAULT_SETTINGS } from '../src/storage/extension-storage';
import { SolutionGenerationRequest } from '../src/types';

describe('AI Providers', () => {
  const dummyRequest: SolutionGenerationRequest = {
    action: 'solve',
    problem: {
      title: 'Two Sum',
      slug: 'two-sum',
      url: 'https://leetcode.com/problems/two-sum/',
      difficulty: 'Easy',
      statement: 'Given array of numbers and target, return indices of two numbers.',
      examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
      constraints: ['2 <= nums.length <= 10^4'],
      starterCode: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass'
    },
    targetLanguage: 'python3'
  };

  describe('ProviderFactory', () => {
    it('should return configured instances', () => {
      expect(ProviderFactory.getProvider('codemind')).toBeInstanceOf(CodeMindProvider);
      expect(ProviderFactory.getProvider('gemini')).toBeInstanceOf(GeminiProvider);
      expect(ProviderFactory.getProvider('openai')).toBeInstanceOf(OpenAIProvider);
      expect(ProviderFactory.getProvider('custom')).toBeInstanceOf(CustomProvider);
    });

    it('should allow seamless switching between all providers', () => {
      const providers = ['codemind', 'gemini', 'openai', 'custom'] as const;
      providers.forEach((p) => {
        const instance = ProviderFactory.getProvider(p);
        expect(instance).toBeDefined();
        expect(instance.id).toBe(p);
      });
    });

    it('should throw on invalid provider', () => {
      expect(() => ProviderFactory.getProvider('unsupported' as any)).toThrow();
    });
  });

  describe('CodeMindProvider', () => {
    const codemind = new CodeMindProvider();

    it('should accurately report configuration status', () => {
      expect(codemind.isConfigured(DEFAULT_SETTINGS)).toBe(true);
      expect(
        codemind.isConfigured({
          ...DEFAULT_SETTINGS,
          codemindEnabled: false
        })
      ).toBe(false);
      expect(
        codemind.isConfigured({
          ...DEFAULT_SETTINGS,
          codemindEndpoint: ''
        })
      ).toBe(false);
    });

    it('should query Ollama /api/tags for dynamic model listing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            { name: 'qwen2.5-coder:7b', size: 4700000000, details: { family: 'qwen2' } },
            { name: 'codemind-ai:latest', size: 4700000000, details: { family: 'qwen2' } }
          ]
        })
      });

      const models = await codemind.listModels(DEFAULT_SETTINGS);
      expect(models.length).toBeGreaterThanOrEqual(2);
      expect(models.some((m) => m.id === 'qwen2.5-coder:7b')).toBe(true);
      expect(models.some((m) => m.id.includes('codemind-ai'))).toBe(true);
    });

    it('should fallback to curated default models when local Ollama is offline', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const models = await codemind.listModels(DEFAULT_SETTINGS);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toBe('codemind-ai');
    });

    it('should test local connection and report model readiness when installed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'codemind-ai' }]
        })
      });

      const res = await codemind.testConnection(DEFAULT_SETTINGS);
      expect(res.success).toBe(true);
      expect(res.message).toContain('Online!');
      expect(res.testedModel).toBe('codemind-ai');
    });

    it('should provide setup instruction hints if model is missing in Ollama', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'some-other-model' }]
        })
      });

      const res = await codemind.testConnection(DEFAULT_SETTINGS);
      expect(res.success).toBe(true);
      expect(res.instructionHint).toContain('ollama run qwen2.5-coder:7b');
    });

    it('should report offline status and setup commands when Ollama is not running', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      const res = await codemind.testConnection(DEFAULT_SETTINGS);
      expect(res.success).toBe(false);
      expect(res.instructionHint).toContain('ollama serve');
    });

    it('should generate valid solution using Ollama /api/chat format', async () => {
      const mockSolution = {
        problemSummary: 'Find two indices summing to target using hash table',
        algorithm: 'Hash map lookup in one pass',
        correctness: 'Complement calculation guarantees exact pair',
        code: 'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []',
        language: 'python3',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        edgeCases: ['Duplicate numbers', 'Negative numbers'],
        assumptions: ['Exactly one solution exists']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify(mockSolution)
          }
        })
      });

      const res = await codemind.generate(dummyRequest, DEFAULT_SETTINGS);
      expect(res.code).toContain('class Solution');
      expect(res.timeComplexity).toBe('O(N)');
      expect(res.edgeCases).toContain('Duplicate numbers');
    });

    it('should handle timeout gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue({ name: 'AbortError' });
      await expect(
        codemind.generate(dummyRequest, {
          ...DEFAULT_SETTINGS,
          codemindTimeoutSeconds: 1
        })
      ).rejects.toThrow(/timed out/i);
    });

    it('should report helpful error on HTTP 404 missing model', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'model not found'
      });
      await expect(codemind.generate(dummyRequest, DEFAULT_SETTINGS)).rejects.toThrow(
        /not found in your local Ollama library/i
      );
    });
  });

  describe('GeminiProvider', () => {
    const gemini = new GeminiProvider();

    it('should accurately report configuration status based on API key', () => {
      expect(gemini.isConfigured(DEFAULT_SETTINGS)).toBe(false);
      expect(gemini.isConfigured({ ...DEFAULT_SETTINGS, geminiApiKey: 'AIzaSy12345' })).toBe(true);
    });

    it('should generate valid solution using mocked fetch', async () => {
      const mockSolution = {
        problemSummary: 'Find two indices summing to target',
        algorithm: 'Hash map lookup',
        correctness: 'Single pass complement verification',
        code: 'class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]',
        language: 'python3',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        edgeCases: ['Duplicate values'],
        assumptions: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockSolution) }]
              }
            }
          ]
        })
      });

      const res = await gemini.generate(dummyRequest, {
        ...DEFAULT_SETTINGS,
        geminiApiKey: 'AIzaSy_test'
      });

      expect(res.problemSummary).toBe(mockSolution.problemSummary);
      expect(res.timeComplexity).toBe('O(n)');
      expect(res.code).toContain('class Solution');
    });

    it('should handle rate limits (HTTP 429) gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: 'Resource has been exhausted' } })
      });

      await expect(
        gemini.generate(dummyRequest, {
          ...DEFAULT_SETTINGS,
          geminiApiKey: 'AIzaSy_test'
        })
      ).rejects.toThrow(/rate limit/i);
    });
  });

  describe('OpenAIProvider', () => {
    const openai = new OpenAIProvider();

    it('should report configuration status accurately', () => {
      expect(openai.isConfigured(DEFAULT_SETTINGS)).toBe(false);
      expect(openai.isConfigured({ ...DEFAULT_SETTINGS, openaiApiKey: 'sk-proj-123' })).toBe(true);
    });

    it('should generate valid solution using mocked chat completions', async () => {
      const mockSolution = {
        problemSummary: 'Find two indices summing to target',
        algorithm: 'Hash map lookup',
        correctness: 'Single pass complement verification',
        code: 'class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]',
        language: 'python3',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        edgeCases: [],
        assumptions: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockSolution)
              }
            }
          ]
        })
      });

      const res = await openai.generate(dummyRequest, {
        ...DEFAULT_SETTINGS,
        openaiApiKey: 'sk-test'
      });

      expect(res.code).toContain('class Solution');
      expect(res.language).toBe('python3');
    });
  });
});
