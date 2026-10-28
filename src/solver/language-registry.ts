export interface SupportedLanguage {
  id: string; // e.g. 'python3'
  displayName: string; // e.g. 'Python 3'
  monacoLanguageId: string; // e.g. 'python'
  aliases: string[]; // e.g. ['python', 'py', 'python3']
  fileExtension: string;
  commentPrefix: string;
  typicalBoilerplate: string;
  standardImports: string[];
  signaturePattern?: RegExp;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'python3',
    displayName: 'Python 3',
    monacoLanguageId: 'python',
    aliases: ['python3', 'python', 'py'],
    fileExtension: '.py',
    commentPrefix: '#',
    typicalBoilerplate: 'class Solution:\n    def solve(self) -> None:\n        pass\n',
    standardImports: ['from typing import List, Optional, Dict, Set, Tuple', 'import collections', 'import heapq']
  },
  {
    id: 'cpp',
    displayName: 'C++',
    monacoLanguageId: 'cpp',
    aliases: ['cpp', 'c++', 'g++'],
    fileExtension: '.cpp',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};',
    standardImports: ['#include <vector>', '#include <string>', '#include <unordered_map>', '#include <algorithm>', 'using namespace std;']
  },
  {
    id: 'java',
    displayName: 'Java',
    monacoLanguageId: 'java',
    aliases: ['java'],
    fileExtension: '.java',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\n    public void solve() {\n        \n    }\n}',
    standardImports: ['import java.util.*;']
  },
  {
    id: 'c',
    displayName: 'C',
    monacoLanguageId: 'c',
    aliases: ['c'],
    fileExtension: '.c',
    commentPrefix: '//',
    typicalBoilerplate: 'void solve() {\n    \n}',
    standardImports: ['#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>']
  },
  {
    id: 'csharp',
    displayName: 'C#',
    monacoLanguageId: 'csharp',
    aliases: ['csharp', 'c#', 'cs'],
    fileExtension: '.cs',
    commentPrefix: '//',
    typicalBoilerplate: 'public class Solution {\n    public void Solve() {\n        \n    }\n}',
    standardImports: ['using System;', 'using System.Collections.Generic;']
  },
  {
    id: 'javascript',
    displayName: 'JavaScript',
    monacoLanguageId: 'javascript',
    aliases: ['javascript', 'js'],
    fileExtension: '.js',
    commentPrefix: '//',
    typicalBoilerplate: '/**\n * @return {void}\n */\nvar solve = function() {\n    \n};',
    standardImports: []
  },
  {
    id: 'typescript',
    displayName: 'TypeScript',
    monacoLanguageId: 'typescript',
    aliases: ['typescript', 'ts'],
    fileExtension: '.ts',
    commentPrefix: '//',
    typicalBoilerplate: 'function solve(): void {\n    \n};',
    standardImports: []
  },
  {
    id: 'go',
    displayName: 'Go',
    monacoLanguageId: 'go',
    aliases: ['go', 'golang'],
    fileExtension: '.go',
    commentPrefix: '//',
    typicalBoilerplate: 'func solve() {\n    \n}',
    standardImports: ['package main', 'import "fmt"']
  },
  {
    id: 'rust',
    displayName: 'Rust',
    monacoLanguageId: 'rust',
    aliases: ['rust', 'rs'],
    fileExtension: '.rs',
    commentPrefix: '//',
    typicalBoilerplate: 'impl Solution {\n    pub fn solve() {\n        \n    }\n}',
    standardImports: []
  },
  {
    id: 'kotlin',
    displayName: 'Kotlin',
    monacoLanguageId: 'kotlin',
    aliases: ['kotlin', 'kt'],
    fileExtension: '.kt',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\n    fun solve() {\n        \n    }\n}',
    standardImports: []
  },
  {
    id: 'swift',
    displayName: 'Swift',
    monacoLanguageId: 'swift',
    aliases: ['swift'],
    fileExtension: '.swift',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\n    func solve() {\n        \n    }\n}',
    standardImports: ['import Foundation']
  },
  {
    id: 'php',
    displayName: 'PHP',
    monacoLanguageId: 'php',
    aliases: ['php'],
    fileExtension: '.php',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\n    function solve() {\n        \n    }\n}',
    standardImports: []
  },
  {
    id: 'ruby',
    displayName: 'Ruby',
    monacoLanguageId: 'ruby',
    aliases: ['ruby', 'rb'],
    fileExtension: '.rb',
    commentPrefix: '#',
    typicalBoilerplate: 'def solve()\n    \nend',
    standardImports: []
  },
  {
    id: 'dart',
    displayName: 'Dart',
    monacoLanguageId: 'dart',
    aliases: ['dart'],
    fileExtension: '.dart',
    commentPrefix: '//',
    typicalBoilerplate: 'class Solution {\n    void solve() {\n        \n    }\n}',
    standardImports: []
  },
  {
    id: 'scala',
    displayName: 'Scala',
    monacoLanguageId: 'scala',
    aliases: ['scala'],
    fileExtension: '.scala',
    commentPrefix: '//',
    typicalBoilerplate: 'object Solution {\n    def solve(): Unit = {\n        \n    }\n}',
    standardImports: []
  }
];

export class LanguageRegistry {
  private static languageMap: Map<string, SupportedLanguage> = new Map();

  static {
    for (const lang of SUPPORTED_LANGUAGES) {
      this.languageMap.set(lang.id.toLowerCase(), lang);
      for (const alias of lang.aliases) {
        this.languageMap.set(alias.toLowerCase(), lang);
      }
    }
  }

  static getAll(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  static findByIdOrAlias(identifier: string): SupportedLanguage | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9#+]/g, '');
    return this.languageMap.get(clean);
  }

  static normalizeLanguageId(identifier: string): string {
    const found = this.findByIdOrAlias(identifier);
    return found ? found.id : 'python3';
  }

  static getDisplayName(identifier: string): string {
    const found = this.findByIdOrAlias(identifier);
    return found ? found.displayName : identifier;
  }

  static getMonacoLanguageId(identifier: string): string {
    const found = this.findByIdOrAlias(identifier);
    return found ? found.monacoLanguageId : 'plaintext';
  }

  static areLanguagesCompatible(lang1: string, lang2: string): boolean {
    const l1 = this.findByIdOrAlias(lang1);
    const l2 = this.findByIdOrAlias(lang2);
    if (!l1 || !l2) return false;
    return l1.id === l2.id;
  }

  /**
   * Validates if the given code has basic syntax hygiene for the target language.
   */
  static validateCodeHygiene(code: string, languageId: string): { valid: boolean; reason?: string } {
    if (!code || code.trim().length === 0) {
      return { valid: false, reason: 'Generated code is empty' };
    }

    const trimmed = code.trim();

    // Check for unwanted markdown backticks that failed extraction
    if (trimmed.startsWith('```') || trimmed.endsWith('```')) {
      return { valid: false, reason: 'Code contains raw markdown code fence markers' };
    }

    // Bracket balance check for C-style and Rust languages
    const cStyleLanguages = ['cpp', 'c', 'java', 'csharp', 'javascript', 'typescript', 'rust', 'kotlin', 'swift', 'php', 'dart', 'scala', 'go'];
    const norm = this.normalizeLanguageId(languageId);

    if (cStyleLanguages.includes(norm)) {
      let curly = 0;
      let square = 0;
      let round = 0;
      let inString = false;
      let stringChar = '';
      let inLineComment = false;
      let inBlockComment = false;

      for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        const next = trimmed[i + 1] || '';

        // Comments
        if (!inString && !inBlockComment && ch === '/' && next === '/') {
          inLineComment = true;
          i++;
          continue;
        }
        if (inLineComment && ch === '\n') {
          inLineComment = false;
          continue;
        }
        if (!inString && !inLineComment && ch === '/' && next === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (inBlockComment && ch === '*' && next === '/') {
          inBlockComment = false;
          i++;
          continue;
        }

        if (inLineComment || inBlockComment) continue;

        // Strings
        if ((ch === '"' || ch === "'" || ch === '`') && (i === 0 || trimmed[i - 1] !== '\\')) {
          if (!inString) {
            inString = true;
            stringChar = ch;
          } else if (stringChar === ch) {
            inString = false;
          }
          continue;
        }

        if (inString) continue;

        if (ch === '{') curly++;
        else if (ch === '}') curly--;
        else if (ch === '[') square++;
        else if (ch === ']') square--;
        else if (ch === '(') round++;
        else if (ch === ')') round--;

        if (curly < 0 || square < 0 || round < 0) {
          return { valid: false, reason: `Unmatched closing bracket '${ch}' found in code` };
        }
      }

      if (curly !== 0) return { valid: false, reason: `Unbalanced curly braces { } (count difference: ${curly})` };
      if (round !== 0) return { valid: false, reason: `Unbalanced parentheses ( ) (count difference: ${round})` };
    }

    return { valid: true };
  }
}
