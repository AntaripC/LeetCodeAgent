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

CRITICAL INSTRUCTIONS:
1. Always write code compatible with the required LeetCode method and class signatures.
2. DO NOT include unnecessary main() or entry point functions unless the problem explicitly demands it.
3. DO NOT wrap the code in excessive explanatory comments inside the code block. Keep code pure and readable.
4. Output MUST BE a valid JSON object matching this schema exactly:
{
  "problemSummary": "A concise 1-2 sentence summary of the core objective and inputs/outputs",
  "algorithm": "Clear, step-by-step explanation of the chosen data structures and algorithm",
  "correctness": "Why this algorithm is mathematically correct and handles invariant properties",
  "code": "The complete, standalone, ready-to-run code in the requested language matching the LeetCode signature",
  "language": "${langInfo.id}",
  "timeComplexity": "O(...) with precise explanation",
  "spaceComplexity": "O(...) with precise explanation",
  "edgeCases": ["List of specific handled edge cases, e.g. empty inputs, negative numbers, duplicates"],
  "assumptions": ["List of any assumptions or explicit constraints used"]
}
5. Return ONLY the raw JSON object. Do not wrap in markdown quotes if possible, or if wrapping, use \`\`\`json.`;

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
