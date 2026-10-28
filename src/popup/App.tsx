import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProblemSection } from './components/ProblemSection';
import { ModelSection } from './components/ModelSection';
import { LanguageSection } from './components/LanguageSection';
import { ActionButtons } from './components/ActionButtons';
import { SolutionReview } from './components/SolutionReview';
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
  title: '1. Two Sum',
  slug: 'two-sum',
  url: 'https://leetcode.com/problems/two-sum/',
  difficulty: 'Easy',
  statement:
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
    }
  ],
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.'
  ],
  starterCode: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
  editorLanguage: 'python3'
};

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [problem, setProblem] = useState<ProblemContext | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [solution, setSolution] = useState<AISolutionResponse | null>(null);
  const [importedProblems, setImportedProblems] = useState<ImportedProblem[]>([]);

  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [currentAction, setCurrentAction] = useState<SolverActionType>('solve');

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

  // 3. Scan active LeetCode tab
  const scanActiveTab = useCallback(async () => {
    setIsLoadingProblem(true);
    setStatus({ level: 'info', message: 'Detecting active LeetCode problem...', loading: true });

    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      setIsLoadingProblem(false);
      setStatus({ level: 'info', message: 'Running outside Chrome extension environment.' });
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id || !activeTab.url) {
        setIsLoadingProblem(false);
        setStatus({ level: 'warning', message: 'No active tab found.' });
        return;
      }

      const isLeetCode = /^https?:\/\/(www\.)?leetcode\.(com|cn)\/problems\/[a-z0-9_-]+/i.test(activeTab.url);
      if (!isLeetCode) {
        setIsLoadingProblem(false);
        setProblem(null);
        setStatus({
          level: 'info',
          message: 'Navigate to any problem on leetcode.com/problems to use the Copilot.'
        });
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
            setStatus({
              level: 'success',
              message: `Loaded previously generated solution for "${extracted.title}".`
            });
            return;
          }
        }

        setStatus({
          level: 'success',
          message: `Detected "${extracted.title}" (${extracted.difficulty}). Ready to solve!`
        });
      };

      // Send extraction message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: 'EXTRACT_PROBLEM_CONTEXT' },
        async (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            // Attempt dynamic programmatic injection of content script
            try {
              if (chrome.scripting && activeTab.id) {
                await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  files: ['content-script.js']
                });

                // Wait 150ms and retry message
                setTimeout(() => {
                  chrome.tabs.sendMessage(
                    activeTab.id!,
                    { type: 'EXTRACT_PROBLEM_CONTEXT' },
                    (retryRes) => {
                      if (retryRes && retryRes.success && retryRes.data) {
                        handleExtractionResult(retryRes.data);
                      } else {
                        setIsLoadingProblem(false);
                        setStatus({
                          level: 'warning',
                          message: 'Could not connect to LeetCode page. Please reload the LeetCode tab and reopen the extension.'
                        });
                      }
                    }
                  );
                }, 150);
                return;
              }
            } catch (injErr) {
              console.warn('[LeetCode Copilot] Script injection failed:', injErr);
            }

            setIsLoadingProblem(false);
            setStatus({
              level: 'warning',
              message: 'Could not connect to LeetCode page content script. Try refreshing the LeetCode tab.'
            });
            return;
          }

          handleExtractionResult(response.data);
        }
      );
    } catch (e: any) {
      setIsLoadingProblem(false);
      setStatus({ level: 'error', message: `Error detecting tab: ${e.message}` });
    }
  }, [settings.useEditorLanguage]);

  useEffect(() => {
    scanActiveTab();
  }, [scanActiveTab]);

  // Handle Provider / Model Change
  const handleProviderChange = (newProvider: AIProviderType) => {
    let newModel = settings.selectedModel;
    if (newProvider === 'gemini') {
      newModel = settings.geminiModel || 'gemini-4-argon';
      if (newModel.includes('2.5-flash')) newModel = 'gemini-4-argon';
    } else if (newProvider === 'openai') {
      newModel = settings.openaiModel || 'gpt-6-astra';
    } else if (newProvider === 'custom') {
      newModel = settings.customModel || 'llama-3.3-70b-versatile';
    }

    const updated = {
      ...settings,
      selectedProvider: newProvider,
      selectedModel: newModel,
      ...(newProvider === 'gemini' ? { geminiModel: newModel } : {}),
      ...(newProvider === 'openai' ? { openaiModel: newModel } : {})
    };
    setSettings(updated);
    ExtensionStorage.saveSettings(updated);
    fetchModelsForProvider(newProvider, updated);
  };

  const handleModelChange = (modelId: string) => {
    const cleanModel = modelId.includes('2.5-flash') ? 'gemini-3.8-flash' : modelId;
    const updated = {
      ...settings,
      selectedModel: cleanModel,
      ...(settings.selectedProvider === 'gemini' ? { geminiModel: cleanModel } : {}),
      ...(settings.selectedProvider === 'openai' ? { openaiModel: cleanModel } : {}),
      ...(settings.selectedProvider === 'custom' ? { customModel: cleanModel } : {})
    };
    setSettings(updated);
    ExtensionStorage.saveSettings(updated);
  };

  // Handle Language Change
  const handleLanguageChange = (langId: string) => {
    const updated = { ...settings, targetLanguage: langId };
    setSettings(updated);
    ExtensionStorage.saveSettings(updated);
  };

  const handleToggleUseEditorLanguage = (useEditor: boolean) => {
    const updated = { ...settings, useEditorLanguage: useEditor };
    setSettings(updated);
    ExtensionStorage.saveSettings(updated);
  };

  // Handle AI Solution Generation
  const handleExecuteAction = async (action: SolverActionType) => {
    if (!problem) {
      setStatus({ level: 'warning', message: 'No active problem detected to solve.' });
      return;
    }

    setCurrentAction(action);
    setIsGenerating(true);
    const providerObj = ProviderFactory.getProvider(settings.selectedProvider);

    setStatus({
      level: 'info',
      message: `Sending problem context to ${providerObj.name} (${settings.selectedModel})...`,
      loading: true
    });

    const requestPayload = {
      action,
      problem: {
        title: problem.title,
        slug: problem.slug,
        url: problem.url,
        difficulty: problem.difficulty,
        statement: problem.statement,
        examples: problem.examples,
        constraints: problem.constraints,
        starterCode: problem.starterCode
      },
      targetLanguage: settings.targetLanguage
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
            message: `Solution generated in ${LanguageRegistry.getDisplayName(settings.targetLanguage)}! Review below.`
          });
        }
      );
    } else {
      // Direct local test call
      try {
        const res = await providerObj.generate(requestPayload, settings);
        setSolution(res);
        setIsGenerating(false);
        setStatus({
          level: 'success',
          message: `Solution generated in ${LanguageRegistry.getDisplayName(settings.targetLanguage)}!`
        });
      } catch (e: any) {
        setIsGenerating(false);
        setStatus({ level: 'error', message: `Generation Error: ${e.message}` });
      }
    }
  };

  // Handle Code Insertion with Overwrite Protection & Verification
  const handleInsertCode = async (forceOverwrite: boolean = false) => {
    if (!solution || !solution.code) {
      setStatus({ level: 'warning', message: 'No generated code available to insert.' });
      return;
    }

    setIsInserting(true);
    setStatus({ level: 'info', message: 'Inserting code into LeetCode Monaco editor...', loading: true });

    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      setIsInserting(false);
      setStatus({ level: 'warning', message: 'Editor insertion only available in extension context.' });
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        setIsInserting(false);
        setStatus({ level: 'error', message: 'Could not find active LeetCode tab.' });
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
            setStatus({
              level: 'warning',
              message: 'Could not communicate with editor. Code has been copied to your clipboard!'
            });
            navigator.clipboard.writeText(solution.code);
            return;
          }

          if (response.data?.needsConfirmation) {
            setOverwriteSnippet(response.data.previousCodeSnippet || '');
            setOverwriteModalOpen(true);
            setStatus({
              level: 'warning',
              message: 'Confirmation needed: Editor already contains existing code.'
            });
            return;
          }

          if (response.success && response.data?.verified) {
            setStatus({
              level: 'success',
              message: 'Code successfully inserted and verified in LeetCode editor! Ready to test and submit.'
            });
          } else if (response.data?.mechanismUsed === 'clipboard-fallback') {
            setStatus({
              level: 'info',
              message: response.data.message
            });
          } else {
            setStatus({
              level: 'warning',
              message: response.data?.message || 'Code inserted (verification pending).'
            });
          }
        }
      );
    } catch (e: any) {
      setIsInserting(false);
      setStatus({ level: 'error', message: `Insertion error: ${e.message}` });
    }
  };

  const handleCopyCode = () => {
    if (solution?.code) {
      navigator.clipboard.writeText(solution.code);
      setStatus({ level: 'success', message: 'Code copied to clipboard!' });
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

  const handleLoadDemoProblem = () => {
    setProblem(DEMO_PROBLEM);
    setStatus({
      level: 'info',
      message: 'Loaded demo problem "1. Two Sum". You can test all generation and optimization actions!'
    });
  };

  const handleClearProblem = () => {
    setProblem(null);
    setSolution(null);
    setStatus({
      level: 'info',
      message: 'Active problem cleared.'
    });
  };

  const handleClearSolution = () => {
    setSolution(null);
    setStatus({
      level: 'info',
      message: 'Solution cleared.'
    });
  };

  const isConfigured = ProviderFactory.getProvider(settings.selectedProvider).isConfigured(settings);

  return (
    <div className="popup-container">
      <Header
        isLeetCode={!!problem}
        providerName={ProviderFactory.getProvider(settings.selectedProvider).name}
        isConfigured={isConfigured}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenImport={() => setImportModalOpen(true)}
      />

      <main className="main-content">
        {status && (
          <StatusBanner
            level={status.level}
            message={status.message}
            loading={status.loading}
            onDismiss={() => setStatus(null)}
          />
        )}

        <ProblemSection
          problem={problem}
          isLoading={isLoadingProblem}
          onRefresh={scanActiveTab}
          onLoadDemo={handleLoadDemoProblem}
          onClearProblem={handleClearProblem}
        />

        <ModelSection
          settings={settings}
          availableModels={availableModels}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        <LanguageSection
          targetLanguage={settings.targetLanguage}
          editorLanguage={problem?.editorLanguage || 'python3'}
          useEditorLanguage={settings.useEditorLanguage}
          onLanguageChange={handleLanguageChange}
          onToggleUseEditorLanguage={handleToggleUseEditorLanguage}
        />

        <ActionButtons
          isGenerating={isGenerating}
          hasProblem={!!problem}
          isConfigured={isConfigured}
          providerName={ProviderFactory.getProvider(settings.selectedProvider).name}
          currentAction={currentAction}
          hasExistingSolution={!!solution}
          onExecuteAction={handleExecuteAction}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onLoadDemoProblem={handleLoadDemoProblem}
        />

        {solution && (
          <SolutionReview
            solution={solution}
            isInserting={isInserting}
            onCopyCode={handleCopyCode}
            onInsertCode={handleInsertCode}
            onClearSolution={handleClearSolution}
          />
        )}
      </main>

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

      {importModalOpen && (
        <ImportProblemsModal
          importedProblems={importedProblems}
          onSaveProblems={async (problems) => {
            await ExtensionStorage.saveImportedProblems(problems);
            setImportedProblems(problems);
          }}
          onSelectProblem={(selected) => {
            setProblem(selected);
            setStatus({
              level: 'info',
              message: `Selected "${selected.title}" (${selected.difficulty}). Ready to solve!`
            });
          }}
          onClose={() => setImportModalOpen(false)}
        />
      )}

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
