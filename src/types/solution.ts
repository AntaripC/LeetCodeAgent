export type SolverActionType = 'solve' | 'explain' | 'optimize' | 'debug';

export interface AISolutionResponse {
  thinking?: string;
  problemSummary: string;
  algorithm: string;
  correctness: string;
  code: string;
  language: string;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  assumptions: string[];
  rawResponse?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedResponse?: AISolutionResponse;
}

export interface SolutionGenerationRequest {
  action: SolverActionType;
  problem: {
    title: string;
    slug: string;
    url: string;
    difficulty: string;
    statement: string;
    examples: string[];
    constraints: string[];
    starterCode: string;
  };
  targetLanguage: string;
  userCurrentCode?: string;
  customInstructions?: string;
}
