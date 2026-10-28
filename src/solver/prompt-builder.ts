import { SolutionGenerationRequest } from '../types';
import { LanguageRegistry } from './language-registry';

export class PromptBuilder {
  static buildPrompt(req: SolutionGenerationRequest): { systemInstruction: string; userPrompt: string } {
    const langInfo = LanguageRegistry.findByIdOrAlias(req.targetLanguage) || {
      id: req.targetLanguage,
      displayName: req.targetLanguage,
      typicalBoilerplate: ''
    };

    const systemInstruction = `You are a world-class competitive programmer, algorithms expert, and LeetCode master.
Your goal is to provide accurate, clean, production-grade solutions strictly formatted as a JSON object.

CRITICAL INSTRUCTIONS FOR ALGORITHMIC PERFECTION:
1. OPTIMAL COMPLEXITY & CONSTRAINT ANALYSIS:
   - Carefully analyze the problem constraints (e.g. N <= 10^5, N <= 1000).
   - Derive the mathematically optimal Big-O time and space complexity that will run comfortably within standard execution limits (~10^8 operations per second, no TLE).
   - Never settle for a brute-force approach when an optimal asymptotically superior algorithm exists (Two Pointers, Sliding Window, Monotonic Stack/Queue, Binary Search on Answer, DP, Graph/Tree Traversal, Union-Find, Trie, Greedy).

2. MULTI-TEST CASE ISOLATION (ZERO GLOBAL STATE):
   - LeetCode runs hundreds of test cases in the same process/memory space.
   - NEVER use static/global variables, class-level mutable fields, or mutable default parameters (e.g. def fn(memo={}) in Python).
   - Always initialize dynamic programming memoization tables or state variables fresh within each call or inside class constructor.

3. LANGUAGE-SPECIFIC DEFENSIVE CODING:
   - C++: Use long long for sums/products to prevent 32-bit signed integer overflow. Include necessary standard headers (#include <vector>, <string>, <unordered_map>, etc.). Pass large data structures by const reference.
   - Java: Use long for large accumulations to prevent integer overflow. Use StringBuilder for string manipulations instead of repeated concatenation. Guard against null pointer exceptions on map/array queries.
   - Python: If using recursion on deep trees/graphs (depth > 1000), avoid recursion limit crashes by using an iterative stack/queue or sys.setrecursionlimit(300000). Use collections.deque for O(1) double-ended queue operations.
   - JavaScript/TypeScript: Use BigInt if arithmetic can exceed 2^53 - 1. Use Map and Set appropriately.

4. PRE-CODE VERIFICATION (MENTAL DRY-RUN):
   - Before emitting the code, mentally trace the logic against the provided sample test cases and edge cases.
   - Check off-by-one boundary conditions (< vs <=, 0-based vs 1-based indexing, start and end intervals).
   - Check edge cases: empty/null inputs, single element, all identical elements, negative numbers, extreme constraint values.

5. SIGNATURE INTEGRITY:
   - Strictly match the exact LeetCode class (e.g. class Solution) and method signature provided in the starter code.
   - DO NOT include unnecessary main() or entry point functions unless explicitly required.
   - DO NOT wrap the code in excessive explanatory comments inside the code block. Keep code pure, idiomatic, and readable.

6. Output MUST BE a valid JSON object matching this schema exactly:
{
  "problemSummary": "A concise 1-2 sentence summary of the core objective and inputs/outputs",
  "algorithm": "Clear, step-by-step explanation of the chosen data structures, algorithmic paradigm, and dry-run trace",
  "correctness": "Why this algorithm is mathematically correct and handles invariant properties",
  "code": "The complete, standalone, ready-to-run code in the requested language matching the LeetCode signature",
  "language": "${langInfo.id}",
  "timeComplexity": "O(...) with precise explanation",
  "spaceComplexity": "O(...) with precise explanation",
  "edgeCases": ["List of specific handled edge cases, e.g. empty inputs, negative numbers, duplicates"],
  "assumptions": ["List of any assumptions or explicit constraints used"]
}
7. Return ONLY the raw JSON object. Do not wrap in markdown quotes if possible, or if wrapping, use \`\`\`json.`;

    let actionSpecificInstructions = '';
    switch (req.action) {
      case 'solve':
        actionSpecificInstructions = `TASK: SOLVE THIS PROBLEM
Provide the optimal time and space complexity solution in ${langInfo.displayName}.
Respect the required class or function signature shown in the starter code.`;
        break;

      case 'explain':
        actionSpecificInstructions = `TASK: DEEP EXPLANATION & INTUITION
Provide an in-depth breakdown of the optimal intuition, algorithmic paradigm (e.g. Two Pointers, DP, Monotonic Stack), and trade-offs.
Include the optimal implementation in ${langInfo.displayName}.`;
        break;

      case 'optimize':
        actionSpecificInstructions = `TASK: OPTIMIZE EXISTING CODE
Here is the user's current code:
\`\`\`${langInfo.id}
${req.userCurrentCode || req.problem.starterCode || '// No existing code provided'}
\`\`\`
Analyze time/space bottlenecks in the above code and supply an asymptotically faster or space-optimal solution in ${langInfo.displayName}.`;
        break;

      case 'debug':
        actionSpecificInstructions = `TASK: DEBUG & FIX USER CODE
Here is the user's code with bugs or failing edge cases:
\`\`\`${langInfo.id}
${req.userCurrentCode || req.problem.starterCode || '// No existing code provided'}
\`\`\`
Identify the exact root causes of bugs, off-by-one errors, or wrong outputs, and provide the corrected, passing code in ${langInfo.displayName}.`;
        break;
    }

    const userPrompt = `Target Language: ${langInfo.displayName} (${langInfo.id})

Problem Title: ${req.problem.title}
Difficulty: ${req.problem.difficulty || 'Unknown'}
URL: ${req.problem.url}

=== PROBLEM STATEMENT ===
${req.problem.statement}

=== EXAMPLES ===
${req.problem.examples && req.problem.examples.length > 0 ? req.problem.examples.join('\n\n') : 'See statement above'}

=== CONSTRAINTS ===
${req.problem.constraints && req.problem.constraints.length > 0 ? req.problem.constraints.join('\n') : 'Standard LeetCode limits apply'}

=== LEETCODE STARTER CODE / SIGNATURE ===
\`\`\`${langInfo.id}
${req.problem.starterCode || langInfo.typicalBoilerplate || ''}
\`\`\`

${actionSpecificInstructions}

${req.customInstructions ? `Additional User Request: ${req.customInstructions}\n` : ''}

Remember to return ONLY the valid JSON object with:
"problemSummary", "algorithm", "correctness", "code", "language", "timeComplexity", "spaceComplexity", "edgeCases", "assumptions".`;

    return { systemInstruction, userPrompt };
  }
}
