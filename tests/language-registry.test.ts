import { describe, it, expect } from 'vitest';
import { LanguageRegistry, SUPPORTED_LANGUAGES } from '../src/solver/language-registry';

describe('LanguageRegistry', () => {
  it('should support at least 15 required programming languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(15);
    const ids = SUPPORTED_LANGUAGES.map(l => l.id);
    expect(ids).toContain('cpp');
    expect(ids).toContain('c');
    expect(ids).toContain('python3');
    expect(ids).toContain('java');
    expect(ids).toContain('javascript');
    expect(ids).toContain('typescript');
    expect(ids).toContain('csharp');
    expect(ids).toContain('go');
    expect(ids).toContain('rust');
    expect(ids).toContain('kotlin');
    expect(ids).toContain('swift');
    expect(ids).toContain('php');
    expect(ids).toContain('ruby');
    expect(ids).toContain('dart');
    expect(ids).toContain('scala');
  });

  it('should resolve language aliases correctly', () => {
    expect(LanguageRegistry.normalizeLanguageId('py')).toBe('python3');
    expect(LanguageRegistry.normalizeLanguageId('python')).toBe('python3');
    expect(LanguageRegistry.normalizeLanguageId('c++')).toBe('cpp');
    expect(LanguageRegistry.normalizeLanguageId('golang')).toBe('go');
    expect(LanguageRegistry.normalizeLanguageId('c#')).toBe('csharp');
    expect(LanguageRegistry.normalizeLanguageId('ts')).toBe('typescript');
    expect(LanguageRegistry.normalizeLanguageId('rs')).toBe('rust');
  });

  it('should return human-friendly display names', () => {
    expect(LanguageRegistry.getDisplayName('python3')).toBe('Python 3');
    expect(LanguageRegistry.getDisplayName('cpp')).toBe('C++');
    expect(LanguageRegistry.getDisplayName('typescript')).toBe('TypeScript');
  });

  it('should correctly check language compatibility', () => {
    expect(LanguageRegistry.areLanguagesCompatible('python3', 'py')).toBe(true);
    expect(LanguageRegistry.areLanguagesCompatible('cpp', 'c++')).toBe(true);
    expect(LanguageRegistry.areLanguagesCompatible('python3', 'java')).toBe(false);
  });

  it('should validate syntax hygiene for balanced and unbalanced brackets', () => {
    const validCpp = `
      class Solution {
      public:
          int twoSum(vector<int>& nums) {
              return 0;
          }
      };
    `;
    expect(LanguageRegistry.validateCodeHygiene(validCpp, 'cpp').valid).toBe(true);

    const invalidCpp = `
      class Solution {
      public:
          int twoSum(vector<int>& nums) {
              return 0;
          }
    `;
    const check = LanguageRegistry.validateCodeHygiene(invalidCpp, 'cpp');
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('Unbalanced');
  });

  it('should detect raw markdown fences in code string', () => {
    const codeWithFence = '```python\ndef solve(): pass\n```';
    expect(LanguageRegistry.validateCodeHygiene(codeWithFence, 'python3').valid).toBe(false);
  });
});
