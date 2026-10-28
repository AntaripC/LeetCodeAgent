import { ExtensionMessage } from '../shared/messages';
import { SolutionGenerator } from '../solver/solution-generator';
import { ProviderFactory } from '../providers/provider-factory';

console.log('[LeetCode AI Copilot] Background Service Worker initialized');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[LeetCode AI Copilot] Extension installed/updated:', details.reason);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'PING': {
          sendResponse({ success: true, data: { status: 'service-worker-alive' } });
          break;
        }

        case 'GENERATE_SOLUTION': {
          const { request, settings } = message.payload;
          const solution = await SolutionGenerator.generateSolution(request, settings);
          sendResponse({
            success: true,
            data: solution
          });
          break;
        }

        case 'TEST_PROVIDER_CONNECTION': {
          const { provider, settings } = message.payload;
          const providerInstance = ProviderFactory.getProvider(provider);
          const result = await providerInstance.testConnection(settings);
          sendResponse({
            success: result.success,
            data: result,
            error: result.success ? undefined : result.message
          });
          break;
        }

        case 'LIST_MODELS': {
          const { provider, settings } = message.payload;
          const providerInstance = ProviderFactory.getProvider(provider);
          const models = await providerInstance.listModels(settings);
          sendResponse({
            success: true,
            data: models
          });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unhandled background message type' });
      }
    } catch (err: any) {
      console.error('[LeetCode AI Copilot] Error handling message in service worker:', err);
      sendResponse({
        success: false,
        error: err.message || 'Unknown background service worker error'
      });
    }
  })();

  return true; // Keep message channel open for async response
});
