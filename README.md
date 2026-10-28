# 🚀 LeetCode AI Copilot — Multi-Model Browser Extension

**LeetCode AI Copilot** is a production-grade Chrome/Chromium extension (Manifest V3) that integrates directly into the official [LeetCode](https://leetcode.com) website. It reads the active problem context, formulates optimal algorithms via **Google Gemini**, **OpenAI**, or **Custom/Ollama** models, and inserts verified solutions directly into LeetCode's built-in Monaco code editor.

🌐 **Product Website & Live Playground**: Check out the official landing page and test the extension directly in your browser:
- **Live Simulator & Web Portal**: [https://antaripc.github.io/LeetCodeAgent/](https://antaripc.github.io/LeetCodeAgent/) (or open `website/index.html` locally)
- **1-Click Extension Download**: `website/downloads/leetcode-copilot-extension.zip`

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Prerequisites: Installing Node.js](#1-prerequisites-installing-nodejs)
3. [Installation of Project Dependencies](#2-install-project-dependencies)
4. [Building the Extension](#3-build-the-extension)
5. [Loading the Unpacked Extension into Chrome](#4-load-the-unpacked-extension-into-chrome)
6. [CodeMind AI: Local & Custom Models (Ollama on M2 Mac)](#5-codemind-ai-local--custom-models-ollama-on-m2-mac)
7. [Configuring Cloud AI Providers (Gemini & OpenAI)](#6-configuring-cloud-ai-providers-gemini--openai)
8. [How to Use on LeetCode](#7-how-to-use-on-leetcode)
9. [Inserting Code into the Editor](#8-inserting-code-into-the-editor)
10. [Supported Programming Languages](#9-supported-programming-languages)
11. [Troubleshooting & Diagnostics](#10-troubleshooting--diagnostics)
12. [Adding a New AI Provider](#11-how-to-add-another-ai-provider)
13. [Running Automated Tests](#12-running-automated-tests)

---

## 🌟 Key Features

- **Direct LeetCode Integration**: Automatically reads the active problem's title, difficulty, statement, test cases, constraints, and current editor language.
- **Resilient Fallback**: Combines modern DOM scraping with direct LeetCode GraphQL API query fallbacks if page content is loading dynamically.
- **First-Class AI Providers**:
  - **CodeMind AI (Local & Custom)**: 100% offline, private coding intelligence powered by Ollama. Optimized for Apple Silicon (M1/M2/M3/M4 with 8GB+ unified memory). Seamlessly load your own fine-tuned weights or LoRA adapters without writing code.
  - **Google Gemini**: Gemini 4 Argon (Latest Frontier Reasoning & Coding), Gemini 3.8 Flash, 2.0 Flash, 1.5 Pro.
  - **OpenAI**: GPT-6 Astra (Latest Frontier Coding & Intelligence), GPT-6.1 Sol (Next-Gen Deep Reasoning), GPT-4o, GPT-4o Mini, o3-mini.
  - **Custom / Compatible**: Any OpenAI-compatible endpoint (Ollama, Groq, DeepSeek, vLLM).
- **Zero Internet / Air-Gapped Privacy with CodeMind**: Solve LeetCode problems completely locally without sending code or problem statements over the internet.
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

## 5. CodeMind AI: Local & Custom Models (Ollama on M2 Mac)

**CodeMind AI** is a first-class local AI provider integrated directly into LeetCode AI Copilot. It operates **100% locally on your machine via Ollama**, guaranteeing total privacy and zero API costs.

### A. Recommended Models for MacBook Air M2 (8GB Unified Memory)
On an 8GB Apple Silicon machine, RAM headroom is critical. We recommend:
1. **`qwen2.5-coder:7b`** (Recommended) — ~4.7 GB RAM footprint. Excellent algorithmic coding performance, fits comfortably in 8GB unified memory with Metal GPU acceleration.
2. **`qwen2.5-coder:1.5b`** (Ultra-lightweight) — ~1.3 GB RAM footprint. Blazing fast, minimal memory overhead.

### B. Setup Commands (Terminal)

1. **Install and start Ollama**:
   ```bash
   # If you haven't installed Ollama yet:
   brew install ollama
   
   # Start the local Ollama background service:
   ollama serve
   ```

2. **Pull the recommended coding model**:
   ```bash
   ollama pull qwen2.5-coder:7b
   ```

3. **Create the `codemind-ai` model tag**:
   ```bash
   # Create a local alias for CodeMind AI:
   ollama cp qwen2.5-coder:7b codemind-ai
   ```

4. **Verify Ollama is responding locally**:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

### C. Supporting Your Future Fine-Tuned Model

When you train or fine-tune your own weights (e.g., QLoRA adapter or GGUF checkpoint trained on competitive programming solutions), you can load it into CodeMind AI with zero extension code changes:

1. Create a `Modelfile` in your model folder:
   ```dockerfile
   FROM ./my-finetuned-codemind.gguf
   # Or base model + adapter:
   # FROM qwen2.5-coder:7b
   # ADAPTER ./codemind-adapter.gguf

   PARAMETER temperature 0.2
   PARAMETER top_p 0.95
   PARAMETER stop "<|im_end|>"
   SYSTEM """You are CodeMind AI, an elite competitive programming and algorithmic reasoning assistant. Respond strictly in valid JSON matching the requested schema."""
   ```

2. Build the model into Ollama:
   ```bash
   ollama create codemind-ai -f Modelfile
   ```

3. Open **LeetCode AI Copilot Settings ⚙️ > CodeMind AI tab** and click **Test Local Connection**. Your custom model will be instantly detected!

---

## 6. Configuring Cloud AI Providers (Gemini & OpenAI)

1. Click the pinned **LeetCode AI Copilot** icon in your browser toolbar to open the popup.
2. In the top right of the popup, click the **Settings (gear icon)**.
3. Configure your desired AI provider:
   - **CodeMind AI (Local)**:
     - Endpoint: `http://127.0.0.1:11434`
     - Model: `codemind-ai` (or choose detected models dynamically)
     - Click **Test Local Connection**.
   - **Google Gemini**:
     - Grab a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
     - Paste your key in the **Gemini API Key** field.
     - Click **Test Connection** to verify latency and model access.
   - **OpenAI**:
     - Grab an API key from [OpenAI Platform](https://platform.openai.com/api-keys).
     - Paste your key in the **OpenAI API Key** field.
     - Click **Test Connection**.
   - **Custom / Compatible**:
     - Any external OpenAI-compatible inference gateway (vLLM, Groq, DeepSeek).
4. Click **Save Changes**.

---

## 7. How to Use on LeetCode

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

## 8. Inserting Code into the Editor

1. In the solution review panel, click **Insert Code**.
2. **Overwrite Protection**: If you already have existing written code in the editor, a confirmation dialog will appear showing a snippet of your existing code. Click **Yes, Replace Code** to confirm.
3. The extension directly updates the Monaco editor instance on LeetCode and verifies that the new code is present.
4. If LeetCode's editor structure is in a special read-only state or blocks direct insertion, the extension automatically copies the code to your clipboard with a notification so you can paste it (`Ctrl+V` / `Cmd+V`).
5. Run and submit the solution using LeetCode's native test buttons!

---

## 9. Supported Programming Languages

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

## 10. Troubleshooting & Diagnostics

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

## 11. How to Add Another AI Provider

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
     ['codemind', new CodeMindProvider()],
     ['gemini', new GeminiProvider()],
     ['openai', new OpenAIProvider()],
     ['custom', new CustomProvider()],
     ['myprovider', new MyProvider()]
   ]);
   ```
3. Add any necessary host permissions in `public/manifest.json`.
4. Rebuild the project using `npm run build`.

---

## 12. Running Automated Tests

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
