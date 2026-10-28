# 🚀 LeetCode AI Copilot — Multi-Model Browser Extension

**LeetCode AI Copilot** is a production-grade Chrome/Chromium extension (Manifest V3) that integrates directly into the official [LeetCode](https://leetcode.com) website. It reads the active problem context, formulates optimal algorithms via **Google Gemini**, **OpenAI**, or **Custom/Ollama** models, and inserts verified solutions directly into LeetCode's built-in Monaco code editor.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Prerequisites: Installing Node.js](#1-prerequisites-installing-nodejs)
3. [Installation of Project Dependencies](#2-install-project-dependencies)
4. [Building the Extension](#3-build-the-extension)
5. [Loading the Unpacked Extension into Chrome](#4-load-the-unpacked-extension-into-chrome)
6. [Configuring API Keys](#5-configuring-api-keys)
7. [How to Use on LeetCode](#6-how-to-use-on-leetcode)
8. [Inserting Code into the Editor](#7-inserting-code-into-the-editor)
9. [Supported Programming Languages](#8-supported-programming-languages)
10. [Troubleshooting & Diagnostics](#9-troubleshooting--diagnostics)
11. [Adding a New AI Provider](#10-how-to-add-another-ai-provider)
12. [Running Automated Tests](#11-running-automated-tests)

---

## 🌟 Key Features

- **Direct LeetCode Integration**: Automatically reads the active problem's title, difficulty, statement, test cases, constraints, and current editor language.
- **Resilient Fallback**: Combines modern DOM scraping with direct LeetCode GraphQL API query fallbacks if page content is loading dynamically.
- **Multi-Model Support**:
  - **Google Gemini**: Gemini 4 Argon (Latest Frontier Reasoning & Coding), Gemini 3.8 Flash, 2.0 Flash, 1.5 Pro.
  - **OpenAI**: GPT-6 Astra (Latest Frontier Coding & Intelligence), GPT-6.1 Sol (Next-Gen Deep Reasoning), GPT-4o, GPT-4o Mini, o3-mini.
  - **Custom / Compatible**: Any OpenAI-compatible endpoint (Ollama, Groq, DeepSeek, vLLM).
- **Local Backend Proxy Option**: Run a local proxy server (`npm run server`) so API keys remain safely in your local machine environment, completely outside the browser extension bundle.
- **Configurable Spending Safeguards**: Set 24h request limits, track latency & token counts, and configure alerts before calling heavy reasoning models.
- **15 Programming Languages**: Full support for Python 3, C++, Java, C, C#, JavaScript, TypeScript, Go, Rust, Kotlin, Swift, PHP, Ruby, Dart, and Scala.
- **Monaco Editor Bridge**: Inserts code directly into LeetCode's Monaco Editor with overwrite protection and instant post-insertion verification.
- **4 Action Modes**:
  - `Solve with AI`: Generates complete, signature-matching solutions with complexity analysis.
  - `Explain Solution`: Step-by-step intuition, algorithmic paradigm, and correctness proofs.
  - `Optimize Code`: Analyzes current code for time/space bottlenecks.
  - `Debug My Code`: Diagnoses failing cases and off-by-one errors.
- **Custom Problem List Import**: Import your own curated problem sets (Blind 75, NeetCode 150) as JSON or CSV and open them in one click.

---

## 1. Prerequisites: Installing Node.js

Ensure you have **Node.js (v18 or higher)** and `npm` installed.

### macOS (Homebrew):
```bash
brew install node
```

### Ubuntu / Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Windows:
Download and install the LTS installer from [nodejs.org](https://nodejs.org/).

### Verify Installation:
```bash
node -v
npm -v
```

---

## 2. Install Project Dependencies

Clone or navigate to the repository directory and run:

```bash
cd /Users/antaripchatterjee/LcAgentNew
npm install
```

---

## 3. Build the Extension

Compile the TypeScript source code, bundle the React popup UI, and create the extension distribution folder (`dist/`):

```bash
npm run build
```

This compiles:
- `dist/manifest.json`: Manifest V3 configuration.
- `dist/index.html`: The popup user interface.
- `dist/service-worker.js`: Background service worker.
- `dist/content-script.js`: LeetCode page integration script.
- `dist/editor-inject.js`: Monaco editor bridge.
- `dist/icons/`: High-resolution PNG icons (16px, 32px, 48px, 128px).

---

## 4. Load the Unpacked Extension into Chrome

1. Open Google Chrome (or any Chromium browser like Brave, Edge, Arc).
2. In the address bar, navigate to:
   ```
   chrome://extensions
   ```
3. In the top right corner, toggle **Developer mode** to **ON**.
4. In the top left corner, click **Load unpacked**.
5. Select the `dist/` directory inside this project folder:
   ```
   /Users/antaripchatterjee/LcAgentNew/dist
   ```
6. The **LeetCode AI Copilot** extension card will appear in your extensions list.
7. Click the Chrome Extensions puzzle icon in the browser toolbar and pin **LeetCode AI Copilot**.

---

## 5. Configuring API Keys

1. Click the pinned **LeetCode AI Copilot** icon in your browser toolbar to open the popup.
2. In the top right of the popup, click the **Settings (gear icon)**.
3. Configure your desired AI provider:
   - **Google Gemini**:
     - Grab a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
     - Paste your key in the **Gemini API Key** field.
     - Click **Test Connection** to verify latency and model access.
   - **OpenAI**:
     - Grab an API key from [OpenAI Platform](https://platform.openai.com/api-keys).
     - Paste your key in the **OpenAI API Key** field.
     - Click **Test Connection**.
   - **Custom / Local LLM (Ollama, Groq, DeepSeek)**:
     - Set the Base URL (e.g., `http://localhost:11434/v1` for local Ollama).
     - Provide the model name (e.g., `llama-3.3-70b-versatile` or `deepseek-chat`).
     - Click **Test Connection**.
4. Click **Save Changes**.

---

## 6. How to Use on LeetCode

1. Open any problem on LeetCode, for example:
   ```
   https://leetcode.com/problems/two-sum/
   ```
2. Click the **LeetCode AI Copilot** icon in the toolbar.
3. The popup automatically scans the page and displays:
   - Problem Title (e.g., `1. Two Sum`)
   - Difficulty badge (`Easy`, `Medium`, or `Hard`)
   - Number of extracted examples and constraints
   - Active language in LeetCode's editor
4. Select your desired AI provider and model.
5. Select your target programming language (or click **Sync with Editor** to match the editor).
6. Click **Solve with AI** (or choose *Explain*, *Optimize*, or *Debug*).
7. In a few seconds, the structured solution review panel will appear with:
   - **Code**: Ready-to-run implementation matching LeetCode's exact signature.
   - **Algorithm & Intuition**: Conceptual walkthrough and correctness proof.
   - **Complexity**: Big-O time and space complexity breakdown.
   - **Edge Cases**: Handled corner cases (empty inputs, duplicates, boundaries).

---

## 7. Inserting Code into the Editor

1. In the solution review panel, click **Insert Code**.
2. **Overwrite Protection**: If you already have existing written code in the editor, a confirmation dialog will appear showing a snippet of your existing code. Click **Yes, Replace Code** to confirm.
3. The extension directly updates the Monaco editor instance on LeetCode and verifies that the new code is present.
4. If LeetCode's editor structure is in a special read-only state or blocks direct insertion, the extension automatically copies the code to your clipboard with a notification so you can paste it (`Ctrl+V` / `Cmd+V`).
5. Run and submit the solution using LeetCode's native test buttons!

---

## 8. Supported Programming Languages

| Language | Identifier | Monaco ID | Aliases |
| :--- | :--- | :--- | :--- |
| **Python 3** | `python3` | `python` | `py`, `python` |
| **C++** | `cpp` | `cpp` | `c++`, `g++` |
| **Java** | `java` | `java` | `java` |
| **C** | `c` | `c` | `c` |
| **C#** | `csharp` | `csharp` | `c#`, `cs` |
| **JavaScript** | `javascript`| `javascript`| `js` |
| **TypeScript** | `typescript`| `typescript`| `ts` |
| **Go** | `go` | `go` | `golang` |
| **Rust** | `rust` | `rust` | `rs` |
| **Kotlin** | `kotlin` | `kotlin` | `kt` |
| **Swift** | `swift` | `swift` | `swift` |
| **PHP** | `php` | `php` | `php` |
| **Ruby** | `ruby` | `ruby` | `rb` |
| **Dart** | `dart` | `dart` | `dart` |
| **Scala** | `scala` | `scala` | `scala` |

---

## 9. Troubleshooting & Diagnostics

### Problem context not detected:
- Ensure the active tab URL begins with `https://leetcode.com/problems/` or `https://leetcode.cn/problems/`.
- If LeetCode just finished loading, click the **Refresh (circular arrow)** button in the Problem section to re-scan.
- If you just installed or updated the extension, refresh the LeetCode tab once so the content script can attach.

### Editor insertion fails:
- Check if your cursor is inside the Monaco code area.
- Click **Copy Code** in the popup and paste directly into the editor using `Ctrl+V` (Windows/Linux) or `Cmd+V` (macOS).

### API errors:
- **HTTP 401 / 403**: Invalid API key. Go to Settings and verify your key.
- **HTTP 429**: Quota limit reached on your AI account. Wait a minute or switch providers.

---

## 10. How to Add Another AI Provider

The codebase follows an extensible Provider Pattern:

1. Create a new provider file in `src/providers/your-provider.ts` implementing the `IAIProvider` interface:
   ```typescript
   import { IAIProvider, ExtensionSettings, ModelOption, ProviderConnectionTestResult, SolutionGenerationRequest, AISolutionResponse } from '../types';

   export class MyProvider implements IAIProvider {
     readonly id = 'myprovider';
     readonly name = 'My Custom AI';

     isConfigured(settings: ExtensionSettings): boolean { ... }
     async listModels(settings: ExtensionSettings): Promise<ModelOption[]> { ... }
     async testConnection(settings: ExtensionSettings): Promise<ProviderConnectionTestResult> { ... }
     async generate(req: SolutionGenerationRequest, settings: ExtensionSettings): Promise<AISolutionResponse> { ... }
   }
   ```
2. Register your provider in `src/providers/provider-factory.ts`:
   ```typescript
   private static providers = new Map<AIProviderType, IAIProvider>([
     ['gemini', new GeminiProvider()],
     ['openai', new OpenAIProvider()],
     ['custom', new CustomProvider()],
     ['myprovider', new MyProvider()]
   ]);
   ```
3. Add any necessary host permissions in `public/manifest.json`.
4. Rebuild the project using `npm run build`.

---

## 11. Running Automated Tests

Run the complete Vitest test suite:
```bash
npm run test
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```

---

## 📄 License
MIT License. Created for educational and technical interview preparation.
