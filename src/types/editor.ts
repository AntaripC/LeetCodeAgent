export type EditorMechanism = 'monaco-api' | 'monaco-dom-paste' | 'dom-input' | 'clipboard-fallback';

export interface EditorState {
  found: boolean;
  language: string;
  currentCode: string;
  hasUserModifications: boolean;
  lineCount: number;
  mechanismAvailable: EditorMechanism;
}

export interface EditorInsertionOptions {
  code: string;
  forceOverwrite?: boolean;
}

export interface EditorInsertionResult {
  success: boolean;
  mechanismUsed: EditorMechanism;
  verified: boolean;
  linesInserted: number;
  message: string;
  previousCodeSnippet?: string;
  needsConfirmation?: boolean;
}
