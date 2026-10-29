import { AISolutionResponse, ValidationResult } from '../types';
import { LanguageRegistry } from './language-registry';

export class ResponseValidator {
  /**
   * Attempts to extract and parse a JSON object from raw model output.
   */
  static extractJSON(rawText: string): any {
    if (!rawText || !rawText.trim()) {
      throw new Error('AI returned an empty response');
    }

    // Strip internal reasoning tokens from frontier models (<think>...</think> or <thought>...</thought>)
    let text = rawText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .trim();

    // 1. Direct parse attempt
    try {
      return JSON.parse(text);
    } catch {
      // Continue to regex extraction
    }

    // 2. Extract ```json ... ``` code fence
    const jsonFenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const fenceMatch = text.match(jsonFenceRegex);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // Fall through
      }
    }

    // 3. Find outermost curly braces { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (err: any) {
        // Try cleaning trailing commas, control characters, or unescaped newlines
        try {
          const cleaned = candidate
            .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
            .replace(/[\u0000-\u001F]+/g, ' '); // remove control characters
          return JSON.parse(cleaned);
        } catch {
          throw new Error(`Failed to parse extracted JSON block: ${err.message}`);
        }
      }
    }

    throw new Error('No JSON object found in AI response');
  }

  /**
   * Cleans code string of accidental markdown wrappers.
   */
  static sanitizeCode(rawCode: string): string {
    if (!rawCode) return '';
    let code = rawCode.trim();

    // Remove leading ```lang and trailing ```
    if (code.startsWith('```')) {
      const firstLineBreak = code.indexOf('\n');
      if (firstLineBreak !== -1) {
        code = code.substring(firstLineBreak + 1);
      } else {
        code = code.replace(/^```[a-zA-Z0-9_-]*/, '');
      }
    }

    if (code.endsWith('```')) {
      code = code.substring(0, code.length - 3);
    }

    return code.trim();
  }

  /**
   * Validates and sanitizes the parsed AI response.
   */
  static validate(rawText: string, expectedLanguage?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any;
    try {
      parsed = this.extractJSON(rawText);
    } catch (e: any) {
      return {
        isValid: false,
        errors: [`JSON Parsing error: ${e.message}`],
        warnings
      };
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        isValid: false,
        errors: ['AI response root must be a JSON object'],
        warnings
      };
    }

    // Normalize code field in case smaller local models return an array of lines or an object keyed by language
    let rawCode = parsed.code;
    if (Array.isArray(rawCode)) {
      rawCode = rawCode.join('\n');
    } else if (rawCode && typeof rawCode === 'object') {
      const firstVal = Object.values(rawCode)[0];
      if (Array.isArray(firstVal)) {
        rawCode = firstVal.join('\n');
      } else if (typeof firstVal === 'string') {
        rawCode = firstVal;
      }
    }

    // Check mandatory fields
    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      errors.push('AI response is missing the "code" field or it is empty');
    }

    const sanitizedCode = this.sanitizeCode(rawCode || '');

    // Check code hygiene
    const targetLang = parsed.language || expectedLanguage || 'python3';
    const hygieneCheck = LanguageRegistry.validateCodeHygiene(sanitizedCode, targetLang);
    if (!hygieneCheck.valid) {
      warnings.push(`Code syntax hygiene warning: ${hygieneCheck.reason}`);
    }

    // Language mismatch warning
    if (expectedLanguage && parsed.language) {
      const normExpected = LanguageRegistry.normalizeLanguageId(expectedLanguage);
      const normReceived = LanguageRegistry.normalizeLanguageId(parsed.language);
      if (normExpected !== normReceived) {
        warnings.push(`Expected solution in ${expectedLanguage}, but model tagged response as ${parsed.language}`);
      }
    }

    const formatTextField = (val: any, fallback: string): string => {
      if (!val) return fallback;
      if (typeof val === 'string') return val.trim();
      if (Array.isArray(val)) {
        return val.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join('\n');
      }
      if (typeof val === 'object') {
        if (Array.isArray(val.steps)) {
          const header = val.name ? `${val.name}:\n` : '';
          return `${header}${val.steps.map((s: any, idx: number) => `${idx + 1}. ${s}`).join('\n')}`;
        }
        return Object.entries(val)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      return String(val);
    };

    // Build structured output
    const edgeCases: string[] = Array.isArray(parsed.edgeCases)
      ? parsed.edgeCases.map((e: any) => String(e))
      : parsed.edgeCases ? [String(parsed.edgeCases)] : [];

    const assumptions: string[] = Array.isArray(parsed.assumptions)
      ? parsed.assumptions.map((a: any) => String(a))
      : parsed.assumptions ? [String(parsed.assumptions)] : [];

    const sanitizedResponse: AISolutionResponse = {
      problemSummary: formatTextField(parsed.problemSummary, 'Problem summary not provided by model.'),
      algorithm: formatTextField(parsed.algorithm, 'Algorithm explanation not provided.'),
      correctness: formatTextField(parsed.correctness, 'Correctness argument not provided.'),
      code: sanitizedCode,
      language: targetLang,
      timeComplexity: String(parsed.timeComplexity || 'O(?)'),
      spaceComplexity: String(parsed.spaceComplexity || 'O(?)'),
      edgeCases,
      assumptions,
      thinking: parsed.thinking ? formatTextField(parsed.thinking, '') : undefined,
      rawResponse: rawText
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedResponse
    };
  }
}
