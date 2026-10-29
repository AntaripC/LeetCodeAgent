import { describe, it, expect } from 'vitest';
import { ResponseValidator } from '../src/solver/response-validator';

describe('ResponseValidator', () => {
  it('should parse direct clean JSON', () => {
    const raw = JSON.stringify({
      problemSummary: 'Find two indices that sum up to target',
      algorithm: 'Use hash map for complement lookup',
      correctness: 'Each element checked once with constant lookup',
      code: 'class Solution:\n    def twoSum(self, nums, target):\n        return []',
      language: 'python3',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      edgeCases: ['No pair exists', 'Negative numbers'],
      assumptions: ['Exactly one solution exists']
    });

    const parsed = ResponseValidator.extractJSON(raw);
    expect(parsed.language).toBe('python3');
    expect(parsed.timeComplexity).toBe('O(n)');
  });

  it('should extract JSON wrapped in markdown fences with preamble', () => {
    const raw = `
Here is the solution to your problem:

\`\`\`json
{
  "problemSummary": "Reverse linked list",
  "algorithm": "Iterative three-pointer approach",
  "correctness": "Inverts next pointers in-place",
  "code": "class Solution:\\n    pass",
  "language": "python3",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "edgeCases": ["Empty list", "Single node"],
  "assumptions": []
}
\`\`\`

I hope this helps!
`;
    const parsed = ResponseValidator.extractJSON(raw);
    expect(parsed.problemSummary).toBe('Reverse linked list');
    expect(parsed.timeComplexity).toBe('O(n)');
  });

  it('should sanitize raw code blocks that have internal markdown wrappers', () => {
    const messyCode = '```python\nclass Solution:\n    def solve(self): pass\n```';
    const cleaned = ResponseValidator.sanitizeCode(messyCode);
    expect(cleaned).toBe('class Solution:\n    def solve(self): pass');
  });

  it('should fail validation if code field is missing or empty', () => {
    const raw = JSON.stringify({
      problemSummary: 'Missing code',
      algorithm: 'Some algorithm',
      correctness: 'Correct',
      code: '',
      language: 'python3'
    });

    const result = ResponseValidator.validate(raw, 'python3');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('missing the "code" field');
  });

  it('should warn when expected language differs from model output', () => {
    const raw = JSON.stringify({
      problemSummary: 'Valid',
      algorithm: 'Valid',
      correctness: 'Valid',
      code: 'def solve(): pass',
      language: 'python3',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)'
    });

    const result = ResponseValidator.validate(raw, 'cpp');
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Expected solution in cpp, but model tagged response as python3');
  });

  it('should preserve fast-thinking intuition and normalize scalar edgeCases', () => {
    const raw = JSON.stringify({
      thinking: 'Array is unsorted, target sum -> single pass hash map O(n) time O(n) space.',
      problemSummary: 'Find two indices summing to target',
      algorithm: 'Hash map with complement lookup',
      correctness: 'Stores seen values and indexes',
      code: 'def twoSum(nums, target): return []',
      language: 'python3',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      edgeCases: 'Single duplicate number',
      assumptions: 'Unique pair exists'
    });

    const result = ResponseValidator.validate(raw, 'python3');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedResponse?.thinking).toBe('Array is unsorted, target sum -> single pass hash map O(n) time O(n) space.');
    expect(result.sanitizedResponse?.edgeCases).toEqual(['Single duplicate number']);
    expect(result.sanitizedResponse?.assumptions).toEqual(['Unique pair exists']);
  });
});
