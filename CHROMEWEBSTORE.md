# Chrome Web Store Listing & Compliance: LeetCode AI Copilot

- **Extension Name**: LeetCode AI Copilot
- **Version**: 1.0.0
- **Category**: Developer Tools / Productivity
- **Last Updated**: 2026-10-28

---

## 1. Store Listing Summary & Descriptions

### Short Description (up to 132 characters)
> Multi-model AI copilot for LeetCode. Solves problems, explains algorithms, and seamlessly inserts code into the LeetCode editor.

### Detailed Description (Markdown)
LeetCode AI Copilot is an intelligent, privacy-first pair programming extension built for developers, competitive programmers, and technical interview candidates.

Directly on the active LeetCode problem page, LeetCode AI Copilot extracts problem context, analyzes constraints and test cases, formulates optimal algorithms, and injects verified solution code directly into LeetCode's built-in Monaco code editor.

### Key Features:
- **Direct LeetCode Integration**: Instantly reads the active problem's title, difficulty, statement, test cases, and constraints without leaving your browser tab.
- **Multi-Model AI Support**: Switch effortlessly between **Google Gemini** (Gemini 2.5 Flash, 2.0 Flash, 1.5 Pro) and **OpenAI** (GPT-4o, GPT-4o Mini, o3-mini) or your own local **Ollama / OpenAI-compatible** endpoints.
- **15 Programming Languages**: Comprehensive language registry supporting Python 3, C++, Java, C, C#, JavaScript, TypeScript, Go, Rust, Kotlin, Swift, PHP, Ruby, Dart, and Scala.
- **Direct Editor Integration**: Uses LeetCode's Monaco Editor APIs to cleanly insert code, complete with overwrite protection and instant syntax verification.
- **Multiple AI Modes**:
  - ✨ **Solve with AI**: Full production-grade solution matching LeetCode's required method signature.
  - 💡 **Explain Solution**: Deep algorithmic walkthrough, intuition, and proof of correctness.
  - ⚡ **Optimize Code**: Analyzes existing code for asymptotic time/space bottlenecks.
  - 🐞 **Debug My Code**: Diagnoses failing test cases, off-by-one errors, and corner cases.
- **Privacy & Safety First**:
  - API keys are stored exclusively in your browser's local storage (`chrome.storage.local`).
  - No user data, LeetCode session cookies, or account credentials are ever collected or transmitted.
  - You maintain full control over code testing and final problem submission.

---

## 2. Permissions Justification

Every permission declared in `manifest.json` is scoped to the absolute minimum privilege required:

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to save user preferences, chosen AI models, and provider API keys securely in the browser's local storage without leaking them to external servers. |
| `tabs` | Required to read the active tab URL to verify the user is currently on an official LeetCode problem page (`leetcode.com/problems/*`). |
| `scripting` | Required to communicate with the page context and bridge with LeetCode's Monaco code editor for code insertion and verification. |
| `activeTab` | Grants temporary access to the active problem tab when the user opens the extension popup. |

### Host Permissions Justification:

| Host Permission | Justification |
| :--- | :--- |
| `https://leetcode.com/*` | Required to extract the active problem statement, test cases, and constraints from the LeetCode web page. |
| `https://leetcode.cn/*` | Required to support LeetCode's regional platform (LeetCode China). |
| `https://generativelanguage.googleapis.com/*` | Required to make direct, secure API calls to the official Google Gemini API when generating solutions. |
| `https://api.openai.com/*` | Required to make direct, secure API calls to the official OpenAI API when generating solutions. |

---

## 3. Privacy & Data Use Disclosure

- **Does this extension collect user personal data?** No.
- **Does this extension use cookies or session credentials?** No.
- **Where are API keys stored?** Locally on the user's machine in `chrome.storage.local`.
- **What is transmitted to AI providers?** Only the problem description, constraints, and target programming language requested by the user.

---

## 4. Privacy Policy

**Effective Date:** October 28, 2026

LeetCode AI Copilot ("we", "our") values user privacy.
1. **Information Collection**: LeetCode AI Copilot does not collect, log, sell, or store any personal information, browsing history outside LeetCode problem pages, or LeetCode account login credentials.
2. **Third-Party AI Services**: When you request a solution or explanation, the extension sends the text of the LeetCode problem statement and your chosen language to your configured AI provider (Google Gemini or OpenAI) using your own personal API key. We do not operate an intermediary server.
3. **Data Security**: Your API keys and extension preferences are stored locally in Chrome's extension sandbox (`chrome.storage.local`).
4. **Changes**: Any future changes to this policy will be documented in this repository.

---

## 5. Pre-Publish Review Checklist

- [x] Manifest V3 compliant (`manifest_version: 3`).
- [x] Real PNG icons provided in `public/icons/` at 16x16, 32x32, 48x48, and 128x128.
- [x] Content scripts and service workers contain no `eval()` or un-sandboxed code execution.
- [x] Minimal required host permissions (restricted to LeetCode and official AI endpoints).
- [x] Plain-English justifications provided for all permissions.
