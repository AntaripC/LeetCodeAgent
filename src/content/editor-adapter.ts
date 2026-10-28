import {
  EditorState,
  EditorInsertionOptions,
  EditorInsertionResult
} from '../types';

export class EditorAdapter {
  /**
   * Reads current editor state using Monaco bridge with DOM fallback.
   */
  static async getEditorState(): Promise<EditorState> {
    return new Promise((resolve) => {
      let resolved = false;

      const handler = (event: any) => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('LEETCODE_COPILOT_EDITOR_STATE_RESULT', handler);

        const detail = event.detail || {};
        if (detail.found) {
          const currentCode = detail.code || '';
          const hasUserModifications = currentCode.trim().length > 100;
          resolve({
            found: true,
            language: detail.language || 'plaintext',
            currentCode,
            hasUserModifications,
            lineCount: detail.lineCount || 0,
            mechanismAvailable: 'monaco-api'
          });
        } else {
          resolve(this.getDOMFallbackState());
        }
      };

      window.addEventListener('LEETCODE_COPILOT_EDITOR_STATE_RESULT', handler);
      window.dispatchEvent(new CustomEvent('LEETCODE_COPILOT_GET_EDITOR_STATE'));

      // Timeout fallback to DOM
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('LEETCODE_COPILOT_EDITOR_STATE_RESULT', handler);
          resolve(this.getDOMFallbackState());
        }
      }, 500);
    });
  }

  private static getDOMFallbackState(): EditorState {
    const editorEl = document.querySelector('.monaco-editor');
    const viewLines = document.querySelector('.monaco-editor .view-lines');
    const currentCode = viewLines ? (viewLines.textContent || '') : '';

    return {
      found: !!editorEl,
      language: 'unknown',
      currentCode,
      hasUserModifications: currentCode.trim().length > 100,
      lineCount: currentCode.split('\n').length,
      mechanismAvailable: editorEl ? 'monaco-dom-paste' : 'clipboard-fallback'
    };
  }

  /**
   * Inserts code into LeetCode Monaco editor with verification, overwrite protection, and fallbacks.
   */
  static async insertCode(options: EditorInsertionOptions): Promise<EditorInsertionResult> {
    const { code, forceOverwrite } = options;

    // 1. Check existing state for overwrite protection
    const state = await this.getEditorState();

    if (!forceOverwrite && state.hasUserModifications && state.currentCode.trim().length > 150) {
      return {
        success: false,
        mechanismUsed: state.mechanismAvailable,
        verified: false,
        linesInserted: 0,
        needsConfirmation: true,
        previousCodeSnippet: state.currentCode.substring(0, 120),
        message: 'Editor already contains existing code. Please confirm before overwriting.'
      };
    }

    // 2. Primary: Try Monaco API via injected bridge
    try {
      const monacoResult = await this.insertViaMonacoAPI(code);
      if (monacoResult.success && monacoResult.verified) {
        return monacoResult;
      }
    } catch {
      // Fall through to DOM paste
    }

    // 3. Fallback: Monaco DOM simulation
    try {
      const domResult = await this.insertViaDOMSimulation(code);
      if (domResult.success && domResult.verified) {
        return domResult;
      }
    } catch {
      // Fall through to clipboard
    }

    // 4. Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(code);
      return {
        success: true,
        mechanismUsed: 'clipboard-fallback',
        verified: false,
        linesInserted: code.split('\n').length,
        message: 'Direct editor insertion was blocked by browser sandbox. Code has been copied to your clipboard! Paste directly with Ctrl+V / Cmd+V.'
      };
    } catch (e: any) {
      return {
        success: false,
        mechanismUsed: 'clipboard-fallback',
        verified: false,
        linesInserted: 0,
        message: `Failed to insert or copy code: ${e.message}`
      };
    }
  }

  private static insertViaMonacoAPI(code: string): Promise<EditorInsertionResult> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const handler = (event: any) => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('LEETCODE_COPILOT_INSERT_RESULT', handler);

        const detail = event.detail || {};
        if (detail.success && detail.verified) {
          resolve({
            success: true,
            mechanismUsed: 'monaco-api',
            verified: true,
            linesInserted: detail.linesInserted || code.split('\n').length,
            previousCodeSnippet: detail.previousCodeSnippet,
            message: 'Code successfully inserted and verified in LeetCode Monaco editor!'
          });
        } else {
          reject(new Error(detail.message || 'Monaco insertion verification failed'));
        }
      };

      window.addEventListener('LEETCODE_COPILOT_INSERT_RESULT', handler);
      window.dispatchEvent(new CustomEvent('LEETCODE_COPILOT_INSERT_CODE', { detail: { code } }));

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('LEETCODE_COPILOT_INSERT_RESULT', handler);
          reject(new Error('Monaco API insertion response timed out'));
        }
      }, 1000);
    });
  }

  private static async insertViaDOMSimulation(code: string): Promise<EditorInsertionResult> {
    const textarea = document.querySelector('.monaco-editor textarea.inputarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      throw new Error('Monaco textarea.inputarea element not found');
    }

    textarea.focus();
    // Select all existing
    document.execCommand('selectAll', false, undefined);

    // Try insertText command
    const inserted = document.execCommand('insertText', false, code);

    // Check if view lines updated
    await new Promise(r => setTimeout(r, 200));
    const viewLines = document.querySelector('.monaco-editor .view-lines');
    const newContent = viewLines?.textContent || '';
    const linesInserted = code.split('\n').length;

    const verified = inserted && newContent.length > 20;

    return {
      success: verified,
      mechanismUsed: 'monaco-dom-paste',
      verified,
      linesInserted,
      message: verified ? 'Code inserted into editor via DOM simulation' : 'DOM simulation could not verify insertion'
    };
  }
}
