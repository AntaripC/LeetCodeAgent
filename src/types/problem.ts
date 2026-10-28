export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';

export interface ProblemContext {
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  statement: string;
  examples: string[];
  constraints: string[];
  starterCode: string;
  editorLanguage: string;
  tags?: string[];
  detectedAt: number;
}

export interface ProblemContextExtractionResult {
  success: boolean;
  context?: ProblemContext;
  error?: string;
  partialContext?: Partial<ProblemContext>;
  diagnostics?: {
    domTitleFound: boolean;
    domContentFound: boolean;
    editorFound: boolean;
    graphqlFallbackUsed?: boolean;
    url: string;
  };
}

export interface ImportedProblem {
  id?: string;
  title: string;
  url: string;
  difficulty?: Difficulty;
  topic?: string;
  completed?: boolean;
}
