import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { Header } from './components/Header';
import { ModelSelectionCards } from './components/ModelSelectionCards';
import { SuggestedCodeView } from './components/SuggestedCodeView';
import { CodeMetricsRow } from './components/CodeMetricsRow';
import { CopilotPromptBar } from './components/CopilotPromptBar';
import { SettingsModal } from './components/SettingsModal';
import { ImportProblemsModal } from './components/ImportProblemsModal';
import { OverwriteModal } from './components/OverwriteModal';
import { StatusBanner, StatusLevel } from './components/StatusBanner';

import {
  ProblemContext,
  ExtensionSettings,
  ModelOption,
  AISolutionResponse,
  SolverActionType,
  AIProviderType,
  ImportedProblem,
  ProviderConnectionTestResult
} from '../types';
import { ExtensionStorage, DEFAULT_SETTINGS } from '../storage/extension-storage';
import { ProviderFactory } from '../providers/provider-factory';
import { LanguageRegistry } from '../solver/language-registry';

const DEMO_PROBLEM: ProblemContext = {
  title: '124. Binary Tree Maximum Path Sum',
  slug: 'binary-tree-maximum-path-sum',
  url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
  difficulty: 'Hard',
  statement:
    'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Return the maximum path sum of any non-empty path.',
  examples: [
    'Input: root = [1,2,3] -> Output: 6 (The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6)'
  ],
  constraints: [
    'The number of nodes in the tree is in the range [1, 3 * 10^4].',
    '-1000 <= Node.val <= 1000'
  ],
  starterCode: 'class Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        pass',
  editorLanguage: 'python3',
  detectedAt: Date.now()
};

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  // Default to null: if not on LeetCode site, problem & snippet are completely empty
  const [problem, setProblem] = useState<ProblemContext | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [solution, setSolution] = useState<AISolutionResponse | null>(null);
  const [importedProblems, setImportedProblems] = useState<ImportedProblem[]>([]);
  const [activeView, setActiveView] = useState<'copilot' | 'history' | 'library'>('copilot');

  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  const [status, setStatus] = useState<{
    level: StatusLevel;
    message: string;
    loading?: boolean;
  } | null>(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
  const [overwriteSnippet, setOverwriteSnippet] = useState('');

  // 1. Load settings and imported problems
  useEffect(() => {
    (async () => {
      const storedSettings = await ExtensionStorage.getSettings();
      setSettings(storedSettings);
      const problems = await ExtensionStorage.getImportedProblems();
      setImportedProblems(problems);
    })();
  }, []);

  // 2. Fetch models for active provider
  const fetchModelsForProvider = useCallback(async (provider: AIProviderType, currentSettings: ExtensionSettings) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'LIST_MODELS',
            payload: { provider, settings: currentSettings }
          },
          (res) => {
            if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
              setAvailableModels(res.data);
            } else {
              fallbackLocalModels(provider, currentSettings);
            }
          }
        );
      } else {
        fallbackLocalModels(provider, currentSettings);
      }
    } catch {
      fallbackLocalModels(provider, currentSettings);
    }
  }, []);

  const fallbackLocalModels = (provider: AIProviderType, currentSettings: ExtensionSettings) => {
    try {
      const p = ProviderFactory.getProvider(provider);
      p.listModels(currentSettings).then(setAvailableModels);
    } catch {}
  };

  useEffect(() => {
    fetchModelsForProvider(settings.selectedProvider, settings);
  }, [settings.selectedProvider, fetchModelsForProvider]);

  // 3. Scan active LeetCode tab - Empty if not on leetcode.com
  const scanActiveTab = useCallback(async () => {
    setIsLoadingProblem(true);

    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      setIsLoadingProblem(false);
      setProblem(null);
      setSolution(null);
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id || !activeTab.url) {
        setIsLoadingProblem(false);
        setProblem(null);
        setSolution(null);
        return;
      }

      const isLeetCode = /^https?:\/\/(www\.)?leetcode\.(com|cn)\/problems\/[a-z0-9_-]+/i.test(activeTab.url);
      if (!isLeetCode) {
        setIsLoadingProblem(false);
        setProblem(null);
        setSolution(null);
        return;
      }

      const handleExtractionResult = async (extracted: ProblemContext) => {
        setIsLoadingProblem(false);
        setProblem(extracted);

        if (settings.useEditorLanguage && extracted.editorLanguage) {
          const normalized = LanguageRegistry.normalizeLanguageId(extracted.editorLanguage);
          setSettings((prev) => ({ ...prev, targetLanguage: normalized }));
        }

        if (extracted.slug) {
          const cached = await ExtensionStorage.getCachedSolution(extracted.slug);
          if (cached) {
            setSolution(cached);
            return;
          }
        }

        setStatus({
          level: 'success',
          message: `Detected "${extracted.title}". Click "Generate Code" to solve automatically!`
        });
      };

      // Send extraction message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: 'EXTRACT_PROBLEM_CONTEXT' },
        async (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            try {
              if (chrome.scripting && activeTab.id) {
                await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  files: ['content-script.js']
                });

                setTimeout(() => {
                  chrome.tabs.sendMessage(
                    activeTab.id!,
                    { type: 'EXTRACT_PROBLEM_CONTEXT' },
                    (retryRes) => {
                      if (retryRes && retryRes.success && retryRes.data) {
                        handleExtractionResult(retryRes.data);
                      } else {
                        setIsLoadingProblem(false);
                        setProblem(null);
                      }
                    }
                  );
                }, 150);
                return;
              }
            } catch {}

            setIsLoadingProblem(false);
            setProblem(null);
            return;
          }

          handleExtractionResult(response.data);
        }
      );
    } catch {
      setIsLoadingProblem(false);
      setProblem(null);
    }
  }, [settings.useEditorLanguage]);

  useEffect(() => {
    scanActiveTab();
  }, [scanActiveTab]);

  // Handle Provider / Model Change
  const handleProviderChange = (newProvider: AIProviderType) => {
    let newModel = settings.selectedModel;
    if (newProvider === 'codemind') {
      newModel = settings.codemindModel || 'codemind-ai';
    } else if (newProvider === 'gemini') {
      newModel = settings.geminiModel || 'gemini-4-argon';
      if (newModel.includes('2.5-flash')) newModel = 'gemini-4-argon';
    } else if (newProvider === 'openai') {
      newModel = settings.openaiModel || 'gpt-6-astra';
    }

    const updated = {
      ...settings,
      selectedProvider: newProvider,
      selectedModel: newModel
    };

    setSettings(updated);
    ExtensionStorage.saveSettings(updated);
  };

  // Automated Code Generation: Analyzes Question and Gives Optimal Answer
  const handleGenerateCode = async () => {
    const activeProb = problem || (typeof chrome === 'undefined' ? DEMO_PROBLEM : null);
    if (!activeProb) {
      setStatus({
        level: 'warning',
        message: 'No LeetCode question detected. Navigate to any problem on leetcode.com/problems.'
      });
      return;
    }

    if (!problem && typeof chrome === 'undefined') {
      setProblem(DEMO_PROBLEM);
    }

    await handleExecutePrompt('Analyze this question and generate the complete optimal solution', 'solve');
  };

  // Execution Handler for Copilot Prompt & Action Pills
  const handleExecutePrompt = async (promptInstruction: string, action: SolverActionType) => {
    const currentProb = problem || (typeof chrome === 'undefined' ? DEMO_PROBLEM : null);
    if (!currentProb) {
      setStatus({
        level: 'warning',
        message: 'No active question. Open a LeetCode problem first.'
      });
      return;
    }

    setIsGenerating(true);
    setStatus({
      level: 'info',
      message: `Analyzing "${currentProb.title}" with ${settings.selectedModel}...`,
      loading: true
    });

    const providerObj = ProviderFactory.getProvider(settings.selectedProvider);

    const requestPayload = {
      action,
      problem: {
        title: currentProb.title,
        slug: currentProb.slug,
        url: currentProb.url,
        difficulty: currentProb.difficulty,
        statement: `${currentProb.statement}\n\nSPECIAL COPILOT INSTRUCTION: ${promptInstruction}`,
        examples: currentProb.examples,
        constraints: currentProb.constraints,
        starterCode: solution?.code || currentProb.starterCode
      },
      targetLanguage: settings.targetLanguage,
      userCurrentCode: solution?.code || currentProb.starterCode
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'GENERATE_SOLUTION',
          payload: {
            request: requestPayload,
            settings
          }
        },
        (res) => {
          setIsGenerating(false);
          if (chrome.runtime.lastError || !res || !res.success) {
            const err = res?.error || chrome.runtime.lastError?.message || 'Generation failed';
            setStatus({ level: 'error', message: `Generation Error: ${err}` });
            return;
          }

          setSolution(res.data);
          setStatus({
            level: 'success',
            message: `Solution generated in ${LanguageRegistry.getDisplayName(settings.targetLanguage)}! Ready to insert.`
          });
        }
      );
    } else {
      try {
        const res = await providerObj.generate(requestPayload, settings);
        setSolution(res);
        setIsGenerating(false);
        setStatus({
          level: 'success',
          message: `Code generated and verified!`
        });
      } catch (e: any) {
        setIsGenerating(false);
        setStatus({ level: 'error', message: `Generation Error: ${e.message}` });
      }
    }
  };

  // Handle Code Insertion into Monaco Editor
  const handleInsertCode = async (forceOverwrite: boolean = false) => {
    if (!solution || !solution.code) {
      setStatus({ level: 'warning', message: 'No generated code available to insert.' });
      return;
    }

    setIsInserting(true);
    setStatus({ level: 'info', message: 'Injecting into Monaco editor...', loading: true });

    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      setIsInserting(false);
      navigator.clipboard.writeText(solution.code);
      setStatus({ level: 'success', message: 'Code copied to clipboard!' });
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        setIsInserting(false);
        navigator.clipboard.writeText(solution.code);
        setStatus({ level: 'warning', message: 'Copied code to clipboard.' });
        return;
      }

      chrome.tabs.sendMessage(
        activeTab.id,
        {
          type: 'INSERT_CODE_TO_EDITOR',
          payload: {
            code: solution.code,
            forceOverwrite
          }
        },
        (response) => {
          setIsInserting(false);
          if (chrome.runtime.lastError || !response) {
            navigator.clipboard.writeText(solution.code);
            setStatus({
              level: 'warning',
              message: 'Code copied to clipboard (editor script offline).'
            });
            return;
          }

          if (response.data?.needsConfirmation) {
            setOverwriteSnippet(response.data.previousCodeSnippet || '');
            setOverwriteModalOpen(true);
            return;
          }

          if (response.success) {
            setStatus({
              level: 'success',
              message: 'Code injected and verified in LeetCode editor!'
            });
          }
        }
      );
    } catch {
      setIsInserting(false);
      navigator.clipboard.writeText(solution.code);
    }
  };

  const handleCopyCode = () => {
    if (solution?.code) {
      navigator.clipboard.writeText(solution.code);
      setStatus({ level: 'success', message: 'Copied code to clipboard!' });
    }
  };

  const handleTestConnection = async (provider: AIProviderType): Promise<ProviderConnectionTestResult> => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'TEST_PROVIDER_CONNECTION',
            payload: { provider, settings }
          },
          (res) => {
            if (chrome.runtime.lastError || !res) {
              resolve({
                success: false,
                message: chrome.runtime.lastError?.message || 'Failed to communicate with service worker'
              });
            } else {
              resolve(res.data || { success: false, message: res.error || 'Test failed' });
            }
          }
        );
      } else {
        const p = ProviderFactory.getProvider(provider);
        p.testConnection(settings).then(resolve);
      }
    });
  };

  const isLeetCode = !!problem;

  return (
    <div className="popup-outer-frame">
      <div className="popup-app-layout">
        {/* Left Vertical Dock */}
        <SidebarNav
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v);
            if (v === 'library') setImportModalOpen(true);
          }}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Main Workspace Panel */}
        <main className="popup-main-panel">
          <Header
            onOpenSettings={() => setSettingsModalOpen(true)}
            onClose={() => {
              if (typeof window !== 'undefined' && window.close) window.close();
            }}
          />

          {status && (
            <StatusBanner
              level={status.level}
              message={status.message}
              loading={status.loading}
              onDismiss={() => setStatus(null)}
            />
          )}

          {/* Model Selection */}
          <ModelSelectionCards
            settings={settings}
            onProviderChange={handleProviderChange}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />

          {/* Suggested Code Window - Empty if not on LeetCode */}
          <SuggestedCodeView
            isLeetCode={isLeetCode}
            solution={solution}
            defaultCode={problem?.starterCode}
            isInserting={isInserting}
            onCopyCode={handleCopyCode}
            onInsertCode={() => handleInsertCode(false)}
          />

          {/* Code Metrics - Standby/Empty if not on LeetCode */}
          <CodeMetricsRow isLeetCode={isLeetCode} solution={solution} />

          {/* Capsule Prompt Bar (Empty by default) & Bottom Actions with Generate Code */}
          <CopilotPromptBar
            isGenerating={isGenerating}
            hasProblem={isLeetCode}
            onGenerateCode={handleGenerateCode}
            onExecutePrompt={(customText, actionType) => {
              handleExecutePrompt(customText, actionType);
            }}
            onCopyCurrentCode={handleCopyCode}
          />
        </main>
      </div>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={async (newSettings) => {
            const updated = await ExtensionStorage.saveSettings(newSettings);
            setSettings(updated);
          }}
          onClose={() => setSettingsModalOpen(false)}
          onTestConnection={handleTestConnection}
        />
      )}

      {/* Problem Library Modal */}
      {importModalOpen && (
        <ImportProblemsModal
          importedProblems={importedProblems}
          onSaveProblems={async (problems) => {
            await ExtensionStorage.saveImportedProblems(problems);
            setImportedProblems(problems);
          }}
          onSelectProblem={(selected) => {
            setProblem(selected);
            setSolution(null);
            setStatus({
              level: 'info',
              message: `Selected "${selected.title}" (${selected.difficulty}). Click "Generate Code" to solve!`
            });
          }}
          onClose={() => setImportModalOpen(false)}
        />
      )}

      {/* Overwrite Confirmation Modal */}
      {overwriteModalOpen && (
        <OverwriteModal
          previousSnippet={overwriteSnippet}
          onConfirm={() => {
            setOverwriteModalOpen(false);
            handleInsertCode(true);
          }}
          onCancel={() => setOverwriteModalOpen(false)}
        />
      )}
    </div>
  );
};
