import { describe, it, expect, beforeEach } from 'vitest';
import { LeetCodeAdapter } from '../src/content/leetcode-adapter';

describe('LeetCodeAdapter', () => {
  it('should identify valid LeetCode problem URLs', () => {
    expect(LeetCodeAdapter.isLeetCodeProblemPage('https://leetcode.com/problems/two-sum/')).toBe(true);
    expect(LeetCodeAdapter.isLeetCodeProblemPage('https://leetcode.com/problems/3sum/description/')).toBe(true);
    expect(LeetCodeAdapter.isLeetCodeProblemPage('https://leetcode.cn/problems/trapping-rain-water/')).toBe(true);
    expect(LeetCodeAdapter.isLeetCodeProblemPage('https://leetcode.com/discuss/general-discussion')).toBe(false);
    expect(LeetCodeAdapter.isLeetCodeProblemPage('https://google.com')).toBe(false);
  });

  it('should extract the problem slug from URL accurately', () => {
    expect(LeetCodeAdapter.extractSlug('https://leetcode.com/problems/two-sum/')).toBe('two-sum');
    expect(LeetCodeAdapter.extractSlug('https://leetcode.com/problems/merge-k-sorted-lists/description/')).toBe('merge-k-sorted-lists');
  });

  describe('DOM Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-track-load="description_content">
          <h4>1. Two Sum</h4>
          <div class="text-difficulty-easy">Easy</div>
          <div class="content__u3I1">
            <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p>
            <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9\n<strong>Output:</strong> [0,1]</pre>
            <ul>
              <li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
              <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
            </ul>
          </div>
        </div>
        <button id="headlessui-listbox-button-1">Python3</button>
        <div class="monaco-editor">
          <div class="view-lines">class Solution:\n    def twoSum(self, nums, target):\n        pass</div>
        </div>
      `;
    });

    it('should extract title, difficulty, statement, examples and language from DOM', () => {
      const extracted = LeetCodeAdapter.extractFromDOM();
      expect(extracted.title).toContain('Two Sum');
      expect(extracted.difficulty).toBe('Easy');
      expect(extracted.statement).toContain('Given an array of integers');
      expect(extracted.examples && extracted.examples.length).toBeGreaterThan(0);
      expect(extracted.editorLanguage).toBe('python3');
      expect(extracted.starterCode).toContain('class Solution');
    });
  });
});
