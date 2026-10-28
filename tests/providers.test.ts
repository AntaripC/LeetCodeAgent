import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderFactory } from '../src/providers/provider-factory';
import { GeminiProvider } from '../src/providers/gemini-provider';
import { OpenAIProvider } from '../src/providers/openai-provider';
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
      expect(ProviderFactory.getProvider('gemini')).toBeInstanceOf(GeminiProvider);
      expect(ProviderFactory.getProvider('openai')).toBeInstanceOf(OpenAIProvider);
      expect(ProviderFactory.getProvider('custom')).toBeInstanceOf(CustomProvider);
    });

    it('should throw on invalid provider', () => {
      expect(() => ProviderFactory.getProvider('unsupported' as any)).toThrow();
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
