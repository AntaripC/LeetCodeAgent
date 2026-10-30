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

FAST-THINKING & ALGORITHMIC ARCHETYPE RULES:
1. ARRAY ORDERING CHECK:
   - Check if array is sorted! If NOT sorted (e.g., Two Sum, pair finding), DO NOT use Two Pointers! Use a Hash Map for O(1) lookups.
   - Only use Two Pointers if the array is already sorted or if problem asks for palindromes/subsequences.
2. SUBARRAY / SUBSTRING CONDITIONS:
   - Positive numbers condition -> Sliding Window O(N).
   - Negative numbers allowed -> Prefix Sums + Hash Map O(N).
3. SHORTEST PATH & GRAPHS:
   - Unweighted shortest path -> Breadth-First Search (BFS) with visited queue.
   - Disjoint sets / Connectivity -> Union-Find (DSU) with path compression.
4. MONOTONIC PROPERTY:
   - Next greater/smaller element -> Monotonic Stack.
   - Monotonic feasibility function -> Binary Search on Answer range [low, high].
5. MULTI-TEST CASE ISOLATION (ZERO GLOBAL STATE):
   - LeetCode runs hundreds of test cases in the same process/memory space.
   - NEVER use static/global variables, class-level mutable fields, or mutable default parameters (e.g. def fn(memo={}) in Python).
   - Always initialize dynamic programming memoization tables or state variables fresh within each call.
6. DEFENSIVE CODING:
   - C++: Use long long for sums/products to prevent 32-bit signed integer overflow. Include necessary standard headers (#include <vector>, <string>, <unordered_map>, etc.).
   - Java: Use long for large accumulations. Use StringBuilder for string manipulations. Guard against null pointer exceptions.
   - Python: Use iterative algorithms or sys.setrecursionlimit to prevent recursion limit crashes. Use collections.deque for O(1) queue operations.
   - JavaScript/TypeScript: Use BigInt if arithmetic can exceed 2^53 - 1. Use Map and Set appropriately.
7. SIGNATURE INTEGRITY:
   - Strictly match the exact LeetCode class (e.g. class Solution) and method signature provided in the starter code.
   - DO NOT include unnecessary main() or entry point functions unless explicitly required.

OUTPUT FORMAT (STRICT JSON ONLY - FAST GENERATION):
Output MUST BE a valid JSON object matching this schema exactly. Prioritize outputting the complete code immediately; keep explanations concise (1 sentence each) to achieve instant sub-second response times:
{
  "code": "The complete, standalone, ready-to-run optimal code in the requested language matching the exact LeetCode signature",
  "thinking": "Rapid 1-sentence deduction of optimal algorithm",
  "problemSummary": "Concise 1-sentence summary of the objective",
  "algorithm": "Brief 1-sentence explanation of the approach",
  "correctness": "Brief 1-sentence proof of invariant",
  "language": "${langInfo.id}",
  "timeComplexity": "O(...) optimal",
  "spaceComplexity": "O(...) optimal",
  "edgeCases": ["Edge cases handled"],
  "assumptions": []
}
Return ONLY the raw JSON object. Do not wrap in markdown quotes if possible, or if wrapping, use \`\`\`json.`;

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
