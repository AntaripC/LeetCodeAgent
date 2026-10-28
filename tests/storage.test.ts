import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionStorage, DEFAULT_SETTINGS } from '../src/storage/extension-storage';

describe('ExtensionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default settings when storage is empty', async () => {
    const settings = await ExtensionStorage.getSettings();
    expect(settings.selectedProvider).toBe('gemini');
    expect(settings.geminiModel).toBe('gemini-4-argon');
    expect(settings.confirmBeforeOverwrite).toBe(true);
  });

  it('should save and retrieve partial settings updates', async () => {
    await ExtensionStorage.saveSettings({ geminiApiKey: 'test-key-123', selectedProvider: 'openai' });
    const settings = await ExtensionStorage.getSettings();
    expect(settings.geminiApiKey).toBe('test-key-123');
    expect(settings.selectedProvider).toBe('openai');
    expect(settings.geminiModel).toBe('gemini-4-argon'); // Preserved default
  });

  it('should cache and retrieve generated solutions by slug', async () => {
    const mockSol = {
      problemSummary: 'Test',
      algorithm: 'Test',
      correctness: 'Test',
      code: 'print(1)',
      language: 'python3',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      edgeCases: [],
      assumptions: []
    };

    await ExtensionStorage.cacheSolution('two-sum', mockSol);
    const cached = await ExtensionStorage.getCachedSolution('two-sum');
    expect(cached).not.toBeNull();
    expect(cached?.code).toBe('print(1)');

    const missing = await ExtensionStorage.getCachedSolution('non-existent');
    expect(missing).toBeNull();
  });

  it('should save and load imported problem lists', async () => {
    const sample = [
      { title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium' as const }
    ];
    await ExtensionStorage.saveImportedProblems(sample);
    const loaded = await ExtensionStorage.getImportedProblems();
    expect(loaded.length).toBe(1);
    expect(loaded[0].title).toBe('3Sum');
  });
});
