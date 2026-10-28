// Injected into the page's MAIN world to interface directly with Monaco Editor
(function () {
  const SCRIPT_ID = '__leetcode_ai_copilot_bridge__';
  if ((window as any)[SCRIPT_ID]) return;
  (window as any)[SCRIPT_ID] = true;

  function getMonacoModel(): any {
    const monaco = (window as any).monaco;
    if (!monaco || !monaco.editor) return null;
    const models = monaco.editor.getModels();
    return models && models.length > 0 ? models[0] : null;
  }

  // Handle Get State
  window.addEventListener('LEETCODE_COPILOT_GET_EDITOR_STATE', () => {
    try {
      const model = getMonacoModel();
      if (!model) {
        window.dispatchEvent(
          new CustomEvent('LEETCODE_COPILOT_EDITOR_STATE_RESULT', {
            detail: { found: false, code: '', language: '', lineCount: 0 }
          })
        );
        return;
      }

      const code = model.getValue();
      const language = model.getLanguageId();
      const lineCount = model.getLineCount();

      window.dispatchEvent(
        new CustomEvent('LEETCODE_COPILOT_EDITOR_STATE_RESULT', {
          detail: { found: true, code, language, lineCount }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('LEETCODE_COPILOT_EDITOR_STATE_RESULT', {
          detail: { found: false, error: err.message }
        })
      );
    }
  });

  // Handle Code Insertion
  window.addEventListener('LEETCODE_COPILOT_INSERT_CODE', (event: any) => {
    try {
      const { code } = event.detail || {};
      if (typeof code !== 'string') {
        window.dispatchEvent(
          new CustomEvent('LEETCODE_COPILOT_INSERT_RESULT', {
            detail: { success: false, verified: false, message: 'Invalid code provided' }
          })
        );
        return;
      }

      const model = getMonacoModel();
      if (!model) {
        window.dispatchEvent(
          new CustomEvent('LEETCODE_COPILOT_INSERT_RESULT', {
            detail: { success: false, verified: false, message: 'Monaco model not accessible' }
          })
        );
        return;
      }

      const previousCode = model.getValue();

      // Apply code update cleanly using pushEditOperations or setValue
      const fullRange = model.getFullModelRange();
      model.pushEditOperations(
        [],
        [
          {
            range: fullRange,
            text: code,
            forceMoveMarkers: true
          }
        ],
        () => null
      );

      // Verify the value took effect
      const currentVal = model.getValue();
      const isVerified = currentVal.trim() === code.trim();

      if (!isVerified) {
        // Fallback to setValue if pushEditOperations didn't fully update
        model.setValue(code);
      }

      const finalVal = model.getValue();
      const verified = finalVal.trim() === code.trim();

      window.dispatchEvent(
        new CustomEvent('LEETCODE_COPILOT_INSERT_RESULT', {
          detail: {
            success: true,
            verified,
            linesInserted: model.getLineCount(),
            previousCodeSnippet: previousCode.substring(0, 100),
            message: verified ? 'Code inserted and verified in Monaco editor' : 'Code inserted (verification pending)'
          }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('LEETCODE_COPILOT_INSERT_RESULT', {
          detail: { success: false, verified: false, message: err.message }
        })
      );
    }
  });

  console.log('[LeetCode AI Copilot] Monaco Editor bridge initialized');
})();
