/**
 * LeetCode AI Copilot - Website & Interactive Playground Logic
 */

// Simulated problem dataset with multi-language solutions
const PROBLEMS_DB = {
  'two-sum': {
    title: '1. Two Sum',
    difficulty: 'Easy',
    difficultyClass: 'badge-easy',
    category: 'Array · Hash Table',
    statement: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.<br><br>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    tokens: 412,
    explanation: 'Single-pass hash map algorithm stores visited numbers with their index. For each number x, we look up whether (target - x) already exists in O(1) time.',
    solutions: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Hash map: val -> index
        lookup = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in lookup:
                return [lookup[complement], i]
            lookup[num] = i
        return []`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> lookup;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (lookup.count(complement)) {
                return {lookup[complement], i};
            }
            lookup[nums[i]] = i;
        }
        return {};
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
      golang: `func twoSum(nums []int, target int) []int {
    lookup := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := lookup[complement]; ok {
            return []int{idx, i}
        }
        lookup[num] = i
    }
    return nil
}`
    }
  },

  'trapping-rain-water': {
    title: '42. Trapping Rain Water',
    difficulty: 'Hard',
    difficultyClass: 'badge-hard',
    category: 'Two Pointers · Dynamic Programming',
    statement: `Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is <code>1</code>, compute how much water it can trap after raining.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    tokens: 684,
    explanation: 'Optimal Two-Pointer approach. Water level at any bar is bounded by min(leftMax, rightMax). Moving the pointer with smaller max height guarantees accurate water collection in O(1) space.',
    solutions: {
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height:
            return 0
            
        left, right = 0, len(height) - 1
        left_max, right_max = height[left], height[right]
        trapped_water = 0
        
        while left < right:
            if left_max < right_max:
                left += 1
                left_max = max(left_max, height[left])
                trapped_water += left_max - height[left]
            else:
                right -= 1
                right_max = max(right_max, height[right])
                trapped_water += right_max - height[right]
                
        return trapped_water`,
      cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        if (height.empty()) return 0;
        int left = 0, right = height.size() - 1;
        int leftMax = height[left], rightMax = height[right];
        int water = 0;

        while (left < right) {
            if (leftMax < rightMax) {
                left++;
                leftMax = max(leftMax, height[left]);
                water += leftMax - height[left];
            } else {
                right--;
                rightMax = max(rightMax, height[right]);
                water += rightMax - height[right];
            }
        }
        return water;
    }
};`,
      java: `class Solution {
    public int trap(int[] height) {
        if (height == null || height.length == 0) return 0;
        int left = 0, right = height.length - 1;
        int leftMax = height[left], rightMax = height[right];
        int water = 0;

        while (left < right) {
            if (leftMax < rightMax) {
                left++;
                leftMax = Math.max(leftMax, height[left]);
                water += leftMax - height[left];
            } else {
                right--;
                rightMax = Math.max(rightMax, height[right]);
                water += rightMax - height[right];
            }
        }
        return water;
    }
}`,
      typescript: `function trap(height: number[]): number {
    if (height.length === 0) return 0;
    let left = 0, right = height.length - 1;
    let leftMax = height[left], rightMax = height[right];
    let water = 0;

    while (left < right) {
        if (leftMax < rightMax) {
            left++;
            leftMax = Math.max(leftMax, height[left]);
            water += leftMax - height[left];
        } else {
            right--;
            rightMax = Math.max(rightMax, height[right]);
            water += rightMax - height[right];
        }
    }
    return water;
}`,
      golang: `func trap(height []int) int {
    if len(height) == 0 {
        return 0
    }
    left, right := 0, len(height)-1
    leftMax, rightMax := height[left], height[right]
    water := 0

    for left < right {
        if leftMax < rightMax {
            left++
            if height[left] > leftMax {
                leftMax = height[left]
            }
            water += leftMax - height[left]
        } else {
            right--
            if height[right] > rightMax {
                rightMax = height[right]
            }
            water += rightMax - height[right]
        }
    }
    return water
}`
    }
  },

  'lru-cache': {
    title: '146. LRU Cache',
    difficulty: 'Medium',
    difficultyClass: 'badge-medium',
    category: 'Hash Table · Linked List · Design',
    statement: `Design a data structure that follows the constraints of a <strong>Least Recently Used (LRU) cache</strong>.<br><br>Implement the <code>LRUCache</code> class with <code>get(key)</code> and <code>put(key, value)</code> both running in average <code>O(1)</code> time complexity.`,
    timeComplexity: 'O(1) per op',
    spaceComplexity: 'O(capacity)',
    tokens: 720,
    explanation: 'Doubly Linked List + Hash Map: Doubly linked list maintains access order (head = most recent, tail = least recent) with O(1) removal and insertion.',
    solutions: {
      python: `class DNode:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {} # key -> DNode
        self.head, self.tail = DNode(), DNode()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: DNode):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert(self, node: DNode):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._insert(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = DNode(key, value)
        self._insert(node)
        self.cache[key] = node
        if len(self.cache) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]`,
      cpp: `class LRUCache {
    int cap;
    list<pair<int, int>> dll; // {key, val}
    unordered_map<int, list<pair<int, int>>::iterator> cache;

public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        if (!cache.count(key)) return -1;
        dll.splice(dll.begin(), dll, cache[key]);
        return cache[key]->second;
    }

    void put(int key, int value) {
        if (cache.count(key)) {
            dll.splice(dll.begin(), dll, cache[key]);
            cache[key]->second = value;
            return;
        }
        if (dll.size() == cap) {
            cache.erase(dll.back().first);
            dll.pop_back();
        }
        dll.emplace_front(key, value);
        cache[key] = dll.begin();
    }
};`,
      java: `class LRUCache {
    private final int capacity;
    private final Map<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > capacity;
            }
        };
    }

    public int get(int key) {
        return map.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        map.put(key, value);
    }
}`,
      typescript: `class LRUCache {
    private capacity: number;
    private map: Map<number, number>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.map = new Map();
    }

    get(key: number): number {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key)!;
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }

    put(key: number, value: number): void {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.capacity) {
            const lruKey = this.map.keys().next().value;
            this.map.delete(lruKey!);
        }
    }
}`,
      golang: `type LRUCache struct {
    capacity int
    items    map[int]*list.Element
    evict    *list.List
}

type entry struct {
    key   int
    value int
}

func Constructor(capacity int) LRUCache {
    return LRUCache{
        capacity: capacity,
        items:    make(map[int]*list.Element),
        evict:    list.New(),
    }
}

func (this *LRUCache) Get(key int) int {
    if elem, ok := this.items[key]; ok {
        this.evict.MoveToFront(elem)
        return elem.Value.(*entry).value
    }
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    if elem, ok := this.items[key]; ok {
        this.evict.MoveToFront(elem)
        elem.Value.(*entry).value = value
        return
    }
    if this.evict.Len() >= this.capacity {
        lru := this.evict.Back()
        if lru != nil {
            this.evict.Remove(lru)
            delete(this.items, lru.Value.(*entry).key)
        }
    }
    elem := this.evict.PushFront(&entry{key, value})
    this.items[key] = elem
}`
    }
  }
};

// UI State
let currentProblemKey = 'two-sum';
let currentLanguage = 'python';
let currentModel = 'gemini-4-argon';
let isGenerating = false;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initPlayground();
  initModal();
  initFAQ();
  initCopyButtons();
});

function initPlayground() {
  const problemSelect = document.getElementById('playgroundProblemSelect');
  const langSelect = document.getElementById('playgroundLangSelect');
  const modelSelect = document.getElementById('playgroundModelSelect');
  const solveBtn = document.getElementById('playgroundSolveBtn');
  const copyBtn = document.getElementById('editorCopyBtn');
  const injectBtn = document.getElementById('editorInjectBtn');

  if (problemSelect) {
    problemSelect.addEventListener('change', (e) => {
      currentProblemKey = e.target.value;
      updateProblemDisplay();
      renderSolution();
    });
  }

  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      renderSolution();
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      currentModel = e.target.value;
      updateModelBadge();
    });
  }

  if (solveBtn) {
    solveBtn.addEventListener('click', triggerSimulatedGeneration);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('editorCodeOutput');
      const code = codeEl?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        showToast('Solution copied to clipboard!');
      });
    });
  }

  const downloadBtn = document.getElementById('editorDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('editorCodeOutput');
      const code = codeEl?.textContent || '';
      const extMap = { python: 'py', cpp: 'cpp', java: 'java', typescript: 'ts', golang: 'go' };
      const ext = extMap[currentLanguage] || 'txt';
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solution.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded solution.${ext}!`);
    });
  }

  const clearBtn = document.getElementById('editorClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('editorCodeOutput');
      if (codeEl) codeEl.textContent = '// Editor cleared. Click Solve, Explain, Optimize, or Debug above.';
      showToast('Editor cleared.');
    });
  }

  // Action chips
  document.querySelectorAll('.playground-action-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      triggerSimulatedGeneration(action);
    });
  });

  if (injectBtn) {
    injectBtn.addEventListener('click', () => {
      showToast('Simulating direct Monaco Editor injection... Injected! ✨');
      injectBtn.textContent = '✓ Injected into Editor';
      setTimeout(() => {
        injectBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Simulate Monaco Injection
        `;
      }, 2000);
    });
  }

  updateProblemDisplay();
  renderSolution();
}

function updateProblemDisplay() {
  const prob = PROBLEMS_DB[currentProblemKey];
  if (!prob) return;

  const titleEl = document.getElementById('playgroundProblemTitle');
  const badgeEl = document.getElementById('playgroundProblemBadge');
  const catEl = document.getElementById('playgroundProblemCategory');
  const statementEl = document.getElementById('playgroundProblemStatement');
  const explanationEl = document.getElementById('playgroundExplanation');
  const timeEl = document.getElementById('playgroundMetricTime');
  const spaceEl = document.getElementById('playgroundMetricSpace');

  if (titleEl) titleEl.textContent = prob.title;
  if (badgeEl) {
    badgeEl.textContent = prob.difficulty;
    badgeEl.className = `badge-difficulty ${prob.difficultyClass}`;
  }
  if (catEl) catEl.textContent = prob.category;
  if (statementEl) statementEl.innerHTML = prob.statement;
  if (explanationEl) explanationEl.textContent = prob.explanation;
  if (timeEl) timeEl.textContent = `Time: ${prob.timeComplexity}`;
  if (spaceEl) spaceEl.textContent = `Space: ${prob.spaceComplexity}`;
}

function updateModelBadge() {
  const latencyMap = {
    'gemini-4-argon': '1,120 ms',
    'gemini-3.8-flash': '430 ms',
    'gpt-6-astra': '980 ms',
    'gpt-6.1-sol': '1,840 ms'
  };
  const latEl = document.getElementById('playgroundMetricLatency');
  if (latEl) {
    latEl.textContent = `Latency: ${latencyMap[currentModel] || '850 ms'}`;
  }
}

function renderSolution() {
  const prob = PROBLEMS_DB[currentProblemKey];
  if (!prob) return;

  const codeEl = document.getElementById('editorCodeOutput');
  const tabEl = document.getElementById('editorActiveTab');
  const extMap = { python: 'solution.py', cpp: 'solution.cpp', java: 'Solution.java', typescript: 'solution.ts', golang: 'solution.go' };

  if (tabEl) tabEl.textContent = extMap[currentLanguage] || 'solution.py';

  const code = prob.solutions[currentLanguage] || '// No solution available for this language';
  if (codeEl) {
    codeEl.textContent = code;
  }
}

function triggerSimulatedGeneration(action = 'solve') {
  if (isGenerating) return;
  isGenerating = true;

  const solveBtn = document.getElementById('playgroundSolveBtn');
  const codeEl = document.getElementById('editorCodeOutput');
  const prob = PROBLEMS_DB[currentProblemKey];

  let targetContent = prob.solutions[currentLanguage] || '';
  let toastMsg = '✨ Solution generated successfully!';

  if (action === 'explain') {
    targetContent = `/* ==========================================================
 * ALGORITHM & INTUITION: ${prob.title}
 * Model: ${currentModel}
 * ==========================================================
 * 1. Problem Summary:
 *    ${prob.category}. Target complexity: Time ${prob.timeComplexity}, Space ${prob.spaceComplexity}.
 *
 * 2. Key Invariant & Strategy:
 *    ${prob.explanation}
 *
 * 3. Step-by-Step Correctness Proof:
 *    - Base cases verify empty or single element edge boundaries.
 *    - Inductive step: every transition preserves the optimal subproblem invariant.
 *    - All operations terminate within bounded iterations.
 * ========================================================== */\n\n` + targetContent;
    toastMsg = '💡 Algorithm explanation generated!';
  } else if (action === 'optimize') {
    targetContent = `// [OPTIMIZED FOR ZERO-ALLOCATION SPACE & TIME]\n// Model: ${currentModel} | Time: ${prob.timeComplexity} | Space: ${prob.spaceComplexity}\n\n` + targetContent;
    toastMsg = '⚡ Code optimized for maximum efficiency!';
  } else if (action === 'debug') {
    targetContent = `/* ==========================================================
 * EDGE CASE & BOUNDARY VERIFICATION
 * Verified against LeetCode test suite (100% test coverage)
 * ==========================================================
 * Checked:
 *  [✓] Empty input & null guard
 *  [✓] Minimum bounds (length = 1, 2)
 *  [✓] Maximum integer limits & overflow protection
 *  [✓] Duplicates and identical elements
 *  [✓] All negative numbers / All zero arrays
 * ========================================================== */\n\n` + targetContent;
    toastMsg = '🐞 Edge cases & boundary tests verified!';
  }

  if (solveBtn) {
    solveBtn.disabled = true;
    solveBtn.innerHTML = `
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/></svg>
      Processing ${action}...
    `;
  }

  if (codeEl) {
    codeEl.textContent = '';
  }

  let index = 0;
  const chunkSize = Math.max(3, Math.floor(targetContent.length / 28));
  const interval = setInterval(() => {
    index += chunkSize;
    if (index >= targetContent.length) {
      clearInterval(interval);
      if (codeEl) codeEl.textContent = targetContent;
      isGenerating = false;
      if (solveBtn) {
        solveBtn.disabled = false;
        solveBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Solve with Copilot
        `;
      }
      showToast(toastMsg);
      updateModelBadge();
    } else {
      if (codeEl) codeEl.textContent = targetContent.slice(0, index) + '▌';
    }
  }, 20);
}

// Modal handling
function initModal() {
  const modal = document.getElementById('installModal');
  const openBtns = document.querySelectorAll('.trigger-install-modal');
  const closeBtn = document.getElementById('closeModalBtn');

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.classList.add('active');
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

// FAQ Accordion
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach((other) => other.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

// Copy Code Buttons
function initCopyButtons() {
  const copyCliBtn = document.getElementById('copyCliBtn');
  if (copyCliBtn) {
    copyCliBtn.addEventListener('click', () => {
      const code = 'git clone https://github.com/AntaripC/LeetCodeAgent.git && cd LeetCodeAgent && npm install && npm run build';
      navigator.clipboard.writeText(code).then(() => {
        showToast('CLI command copied!');
      });
    });
  }
}

// Toast helper
function showToast(message) {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
