import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../src/solver/prompt-builder';
import { SolutionGenerationRequest } from '../src/types';

describe('PromptBuilder', () => {
  const baseRequest: SolutionGenerationRequest = {
    action: 'solve',
    problem: {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      url: 'https://leetcode.com/problems/valid-parentheses/',
      difficulty: 'Easy',
      statement: 'Given string s containing parentheses, determine if input is valid.',
      examples: ['() -> true', '()[]{} -> true'],
      constraints: ['1 <= s.length <= 10^4'],
      starterCode: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass'
    },
    targetLanguage: 'python3'
  };

  it('should include problem statement, constraints, and JSON schema instructions', () => {
    const { systemInstruction, userPrompt } = PromptBuilder.buildPrompt(baseRequest);
    expect(systemInstruction).toContain('valid JSON object');
    expect(systemInstruction).toContain('thinking');
    expect(systemInstruction).toContain('problemSummary');
    expect(systemInstruction).toContain('timeComplexity');
    expect(systemInstruction).toContain('FAST-THINKING & ALGORITHMIC ARCHETYPE RULES');
    expect(userPrompt).toContain('Valid Parentheses');
    expect(userPrompt).toContain('Given string s containing parentheses');
    expect(userPrompt).toContain('Python 3');
  });

  it('should format instruction for "explain" action', () => {
    const { userPrompt } = PromptBuilder.buildPrompt({ ...baseRequest, action: 'explain' });
    expect(userPrompt).toContain('TASK: DEEP EXPLANATION & INTUITION');
  });

  it('should format instruction for "optimize" action including user code', () => {
    const { userPrompt } = PromptBuilder.buildPrompt({
      ...baseRequest,
      action: 'optimize',
      userCurrentCode: 'def isValid(s): return True'
    });
    expect(userPrompt).toContain('TASK: OPTIMIZE EXISTING CODE');
    expect(userPrompt).toContain('def isValid(s): return True');
  });

  it('should format instruction for "debug" action', () => {
    const { userPrompt } = PromptBuilder.buildPrompt({
      ...baseRequest,
      action: 'debug',
      userCurrentCode: 'def isValid(s): return False'
    });
    expect(userPrompt).toContain('TASK: DEBUG & FIX USER CODE');
  });
});
