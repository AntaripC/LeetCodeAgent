import { LeetCodeAdapter } from './leetcode-adapter';
import { EditorAdapter } from './editor-adapter';
import { ExtensionMessage } from '../shared/messages';

// Inject Monaco bridge into page context
function injectMonacoBridge() {
  const existing = document.getElementById('leetcode-ai-copilot-inject');
  if (existing) return;

  try {
    const script = document.createElement('script');
    script.id = 'leetcode-ai-copilot-inject';
    script.src = chrome.runtime.getURL('editor-inject.js');
    (document.head || document.documentElement).appendChild(script);
  } catch (err) {
    console.warn('[LeetCode AI Copilot] Could not inject editor bridge:', err);
  }
}

injectMonacoBridge();

// Handle messages from Popup or Background Service Worker
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'PING': {
          sendResponse({
            success: true,
            data: {
              url: window.location.href,
              isProblemPage: LeetCodeAdapter.isLeetCodeProblemPage(),
              titleSlug: LeetCodeAdapter.extractSlug()
            }
          });
          break;
        }

        case 'EXTRACT_PROBLEM_CONTEXT': {
          const result = await LeetCodeAdapter.extractProblemContext();
          sendResponse({
            success: result.success,
            data: result.context,
            error: result.error
          });
          break;
        }

        case 'GET_EDITOR_STATE': {
          const state = await EditorAdapter.getEditorState();
          sendResponse({
            success: true,
            data: state
          });
          break;
        }

        case 'INSERT_CODE_TO_EDITOR': {
          const result = await EditorAdapter.insertCode(message.payload);
          sendResponse({
            success: result.success,
            data: result,
            error: result.success ? undefined : result.message
          });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (err: any) {
      sendResponse({
        success: false,
        error: err.message || 'Error processing message in content script'
      });
    }
  })();

  return true; // Keep message channel open for async response
});

// Detect in-app single-page navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // Reinject bridge on navigation if needed
    injectMonacoBridge();
  }
});
observer.observe(document, { subtree: true, childList: true });
window.addEventListener('popstate', () => {
  injectMonacoBridge();
});
