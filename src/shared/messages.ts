import {
  ProblemContextExtractionResult,
  EditorState,
  EditorInsertionOptions,
  EditorInsertionResult,
  SolutionGenerationRequest,
  AISolutionResponse,
  AIProviderType,
  ExtensionSettings,
  ModelOption,
  ProviderConnectionTestResult
} from '../types';

export type MessageType =
  | 'PING'
  | 'EXTRACT_PROBLEM_CONTEXT'
  | 'GET_EDITOR_STATE'
  | 'INSERT_CODE_TO_EDITOR'
  | 'GENERATE_SOLUTION'
  | 'TEST_PROVIDER_CONNECTION'
  | 'LIST_MODELS';

export interface PingMessage {
  type: 'PING';
}

export interface ExtractProblemContextMessage {
  type: 'EXTRACT_PROBLEM_CONTEXT';
}

export interface GetEditorStateMessage {
  type: 'GET_EDITOR_STATE';
}

export interface InsertCodeToEditorMessage {
  type: 'INSERT_CODE_TO_EDITOR';
  payload: EditorInsertionOptions;
}

export interface GenerateSolutionMessage {
  type: 'GENERATE_SOLUTION';
  payload: {
    request: SolutionGenerationRequest;
    settings: ExtensionSettings;
  };
}

export interface TestProviderConnectionMessage {
  type: 'TEST_PROVIDER_CONNECTION';
  payload: {
    provider: AIProviderType;
    settings: ExtensionSettings;
  };
}

export interface ListModelsMessage {
  type: 'LIST_MODELS';
  payload: {
    provider: AIProviderType;
    settings: ExtensionSettings;
  };
}

export type ExtensionMessage =
  | PingMessage
  | ExtractProblemContextMessage
  | GetEditorStateMessage
  | InsertCodeToEditorMessage
  | GenerateSolutionMessage
  | TestProviderConnectionMessage
  | ListModelsMessage;

export type ExtensionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
