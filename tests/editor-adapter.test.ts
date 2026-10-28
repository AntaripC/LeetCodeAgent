import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorAdapter } from '../src/content/editor-adapter';

describe('EditorAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="monaco-editor">
        <textarea class="inputarea"></textarea>
        <div class="view-lines">line 1\nline 2</div>
      </div>
    `;
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it('should detect DOM fallback state when Monaco API is not yet attached', async () => {
    const state = await EditorAdapter.getEditorState();
    expect(state.found).toBe(true);
    expect(state.mechanismAvailable).toBe('monaco-dom-paste');
  });

  it('should enforce overwrite protection when user code is long and forceOverwrite is false', async () => {
    // Inject long code into DOM lines
    const viewLines = document.querySelector('.monaco-editor .view-lines')!;
    viewLines.textContent = 'x'.repeat(250);

    const result = await EditorAdapter.insertCode({
      code: 'class Solution:\n    def solve(): pass',
      forceOverwrite: false
    });

    expect(result.needsConfirmation).toBe(true);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Please confirm before overwriting');
  });

  it('should fallback to clipboard when direct insertion fails or document.execCommand fails', async () => {
    // When forceOverwrite is true, if Monaco API is unreachable and execCommand fails, it copies to clipboard
    document.execCommand = vi.fn().mockReturnValue(false);

    const result = await EditorAdapter.insertCode({
      code: 'print("Hello")',
      forceOverwrite: true
    });

    expect(result.mechanismUsed).toBe('clipboard-fallback');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('print("Hello")');
  });
});
