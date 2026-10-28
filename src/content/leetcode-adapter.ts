import {
  Difficulty,
  ProblemContext,
  ProblemContextExtractionResult
} from '../types';
import { LanguageRegistry } from '../solver/language-registry';

export class LeetCodeAdapter {
  /**
   * Checks if the given or current URL matches a supported LeetCode problem page.
   */
  static isLeetCodeProblemPage(url: string = window.location.href): boolean {
    return /^https?:\/\/(www\.)?leetcode\.(com|cn)\/problems\/[a-z0-9_-]+/i.test(url);
  }

  /**
   * Extracts the problem slug from URL.
   */
  static extractSlug(url: string = window.location.href): string {
    const match = url.match(/\/problems\/([a-z0-9_-]+)/i);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Primary DOM extraction method with multiple resilient selector fallbacks.
   */
  static extractFromDOM(): Partial<ProblemContext> {
    const partial: Partial<ProblemContext> = {
      url: window.location.href,
      slug: this.extractSlug(),
      examples: [],
      constraints: []
    };

    // 1. Title Extraction
    const titleSelectors = [
      '[data-track-load="description_content"] h4',
      '.text-title-large',
      'div[class*="title-large"]',
      'div[class*="text-title"]',
      'div[class*="title__"]',
      'a[href*="/problems/"]'
    ];

    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) {
        const text = el.textContent.trim();
        // LeetCode titles often start with "123. Problem Name"
        if (text.length > 2 && !text.includes('LeetCode')) {
          partial.title = text;
          break;
        }
      }
    }

    if (!partial.title) {
      const docTitle = document.title;
      if (docTitle && docTitle.includes('- LeetCode')) {
        partial.title = docTitle.replace('- LeetCode', '').trim();
      } else {
        // Fallback to capitalizing the slug
        const slug = partial.slug || '';
        partial.title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // 2. Difficulty Extraction
    const diffSelectors = [
      '.text-difficulty-easy, [class*="text-difficulty-easy"], [class*="text-easy"]',
      '.text-difficulty-medium, [class*="text-difficulty-medium"], [class*="text-medium"]',
      '.text-difficulty-hard, [class*="text-difficulty-hard"], [class*="text-hard"]'
    ];

    if (document.querySelector(diffSelectors[0])) {
      partial.difficulty = 'Easy';
    } else if (document.querySelector(diffSelectors[1])) {
      partial.difficulty = 'Medium';
    } else if (document.querySelector(diffSelectors[2])) {
      partial.difficulty = 'Hard';
    } else {
      // Search badges or tags
      const badges = document.querySelectorAll('div, span');
      for (const b of Array.from(badges)) {
        const txt = b.textContent?.trim();
        if (txt === 'Easy' || txt === 'Medium' || txt === 'Hard') {
          partial.difficulty = txt as Difficulty;
          break;
        }
      }
      if (!partial.difficulty) {
        partial.difficulty = 'Unknown';
      }
    }

    // 3. Problem Statement & Description
    const descSelectors = [
      '[data-track-load="description_content"]',
      '.elfjS',
      'div[class*="content__"]',
      'div[class*="description__"]',
      '.question-content'
    ];

    let descEl: Element | null = null;
    for (const sel of descSelectors) {
      descEl = document.querySelector(sel);
      if (descEl) break;
    }

    if (descEl) {
      const rawHtml = descEl.innerHTML;
      // Convert basic HTML to readable plain text / markdown
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;

      // Extract examples
      const exampleBlocks = tempDiv.querySelectorAll('pre, .example-block, div[class*="example"]');
      exampleBlocks.forEach(ex => {
        const text = ex.textContent?.trim();
        if (text && (text.includes('Input:') || text.includes('Output:'))) {
          partial.examples!.push(text);
        }
      });

      // Extract constraints
      const listItems = tempDiv.querySelectorAll('ul li, ol li');
      listItems.forEach(li => {
        const txt = li.textContent?.trim();
        if (txt && (txt.includes('<=') || txt.includes('>=') || txt.includes('length') || txt.includes('consists'))) {
          partial.constraints!.push(txt);
        }
      });

      partial.statement = (tempDiv.innerText || tempDiv.textContent || '').trim();
    }

    // 4. Editor Language
    const langBtn = document.querySelector('button[id*="headlessui-listbox-button"], button[class*="rounded"][class*="px-"][aria-haspopup="listbox"]');
    if (langBtn && langBtn.textContent) {
      const langText = langBtn.textContent.trim();
      partial.editorLanguage = LanguageRegistry.normalizeLanguageId(langText);
    } else {
      // Look for Monaco or language indicators
      const codeEditorLang = document.querySelector('[data-mode-id]');
      if (codeEditorLang) {
        partial.editorLanguage = LanguageRegistry.normalizeLanguageId(codeEditorLang.getAttribute('data-mode-id') || 'python3');
      } else {
        partial.editorLanguage = 'python3';
      }
    }

    // 5. Existing code in editor DOM (as initial fallback)
    const viewLines = document.querySelector('.monaco-editor .view-lines');
    if (viewLines) {
      partial.starterCode = viewLines.textContent || '';
    }

    return partial;
  }

  /**
   * Resilient GraphQL fallback query executed directly in page context.
   */
  static async fetchFromGraphQL(slug: string): Promise<Partial<ProblemContext> | null> {
    if (!slug) return null;

    try {
      const query = `
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            titleSlug
            content
            difficulty
            exampleTestcaseList
            topicTags {
              name
              slug
            }
            codeSnippets {
              lang
              langSlug
              code
            }
          }
        }
      `;

      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { titleSlug: slug }
        })
      });

      if (!response.ok) return null;

      const result = await response.json();
      const q = result.data?.question;
      if (!q) return null;

      // Clean HTML statement
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = q.content || '';
      const statement = (tempDiv.innerText || tempDiv.textContent || '').trim();

      const examples: string[] = [];
      tempDiv.querySelectorAll('pre, .example-block').forEach(el => {
        if (el.textContent) examples.push(el.textContent.trim());
      });

      const constraints: string[] = [];
      tempDiv.querySelectorAll('ul li').forEach(el => {
        const txt = el.textContent?.trim();
        if (txt) constraints.push(txt);
      });

      const tags = (q.topicTags || []).map((t: any) => t.name);

      return {
        title: q.title || slug,
        slug: q.titleSlug || slug,
        difficulty: (q.difficulty as Difficulty) || 'Unknown',
        statement,
        examples,
        constraints,
        tags
      };
    } catch {
      return null;
    }
  }

  /**
   * Master context extraction combining DOM scraping and GraphQL fallback.
   */
  static async extractProblemContext(): Promise<ProblemContextExtractionResult> {
    if (!this.isLeetCodeProblemPage()) {
      return {
        success: false,
        error: 'Active tab is not a supported LeetCode problem page (URL must match leetcode.com/problems/*)'
      };
    }

    const domContext = this.extractFromDOM();
    const slug = domContext.slug || this.extractSlug();

    // Check if DOM extraction got everything needed
    const isDOMComplete = !!(domContext.title && domContext.statement && domContext.statement.length > 50);

    let finalContext: ProblemContext;
    let graphqlFallbackUsed = false;

    if (!isDOMComplete && slug) {
      // Use GraphQL fallback
      const gqlContext = await this.fetchFromGraphQL(slug);
      if (gqlContext) {
        graphqlFallbackUsed = true;
        finalContext = {
          title: gqlContext.title || domContext.title || slug,
          slug,
          url: window.location.href,
          difficulty: gqlContext.difficulty || domContext.difficulty || 'Unknown',
          statement: gqlContext.statement || domContext.statement || 'Problem description is loading...',
          examples: gqlContext.examples && gqlContext.examples.length > 0 ? gqlContext.examples : (domContext.examples || []),
          constraints: gqlContext.constraints && gqlContext.constraints.length > 0 ? gqlContext.constraints : (domContext.constraints || []),
          starterCode: domContext.starterCode || '',
          editorLanguage: domContext.editorLanguage || 'python3',
          tags: gqlContext.tags || [],
          detectedAt: Date.now()
        };
      } else {
        finalContext = {
          title: domContext.title || slug,
          slug,
          url: window.location.href,
          difficulty: domContext.difficulty || 'Unknown',
          statement: domContext.statement || 'Problem description not yet fully rendered.',
          examples: domContext.examples || [],
          constraints: domContext.constraints || [],
          starterCode: domContext.starterCode || '',
          editorLanguage: domContext.editorLanguage || 'python3',
          detectedAt: Date.now()
        };
      }
    } else {
      finalContext = {
        title: domContext.title || slug,
        slug,
        url: window.location.href,
        difficulty: domContext.difficulty || 'Unknown',
        statement: domContext.statement || '',
        examples: domContext.examples || [],
        constraints: domContext.constraints || [],
        starterCode: domContext.starterCode || '',
        editorLanguage: domContext.editorLanguage || 'python3',
        detectedAt: Date.now()
      };
    }

    return {
      success: true,
      context: finalContext,
      diagnostics: {
        domTitleFound: !!domContext.title,
        domContentFound: !!domContext.statement,
        editorFound: !!document.querySelector('.monaco-editor'),
        graphqlFallbackUsed,
        url: window.location.href
      }
    };
  }
}
