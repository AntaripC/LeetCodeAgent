import http from 'http';
import fs from 'fs';
import path from 'path';

// Helper to load .env from project root or home directory
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.env.HOME || '', '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
      } catch (e) {
        console.warn(`[Local Backend] Could not read ${envPath}:`, e.message);
      }
    }
  }
}

loadEnv();

const PORT = process.env.PORT || 3001;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function handleGenerate(body) {
  const { provider, model, request, apiKeyOverride } = body;

  if (provider === 'gemini') {
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set on the local server or environment. Add GEMINI_API_KEY to your .env file.');
    }
    const cleanModel = (model || 'gemini-2.5-pro').replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemPrompt = `You are a world-class competitive programmer, algorithms expert, and LeetCode master.
Your goal is to provide accurate, clean, production-grade solutions strictly formatted as a JSON object.

CRITICAL RULES:
1. OPTIMAL COMPLEXITY: Derive mathematically optimal Big-O based on constraints (no TLE).
2. ZERO GLOBAL STATE: LeetCode runs multiple tests in one process; never use global/static variables or mutable default parameters.
3. LANGUAGE HYGIENE: In C++/Java use 64-bit integers (long long/long) for large sums; in Python handle deep recursion or use iterative logic; in JS use BigInt when needed.
4. DRY RUN: Verify boundary checks (< vs <=, 0-indexing) against sample test cases before outputting code.
5. SIGNATURE: Match the exact LeetCode class Solution and method signatures. Return ONLY raw JSON matching this schema:
{
  "problemSummary": "Summary",
  "algorithm": "Detailed intuition and dry-run trace",
  "correctness": "Proof of invariants",
  "code": "Ready-to-run solution code",
  "language": "${request.targetLanguage}",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "edgeCases": ["Edge cases handled"],
  "assumptions": []
}`;

    const userPrompt = `Problem: ${request.problem.title} (${request.problem.difficulty})
Target Language: ${request.targetLanguage}
Statement:
${request.problem.statement}

Constraints:
${(request.problem.constraints || []).join('\n')}

Starter Code:
${request.problem.starterCode || ''}

Action: ${request.action}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      let msg = `Gemini returned HTTP ${resp.status}`;
      try {
        const j = JSON.parse(errText);
        if (j.error?.message) msg = j.error.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await resp.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response candidate from Gemini');
    return JSON.parse(raw);
  } else if (provider === 'openai') {
    const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set on the local server or environment. Add OPENAI_API_KEY to your .env file.');
    }
    const cleanModel = model || 'o3-mini';
    const isReasoning = cleanModel.startsWith('o1') || cleanModel.startsWith('o3') || cleanModel.includes('sol');

    const systemPrompt = `You are a world-class competitive programmer, algorithms expert, and LeetCode master.
Your goal is to provide accurate, clean, production-grade solutions strictly formatted as a JSON object.

CRITICAL RULES:
1. OPTIMAL COMPLEXITY: Derive mathematically optimal Big-O based on constraints (no TLE).
2. ZERO GLOBAL STATE: LeetCode runs multiple tests in one process; never use global/static variables or mutable default parameters.
3. LANGUAGE HYGIENE: In C++/Java use 64-bit integers (long long/long) for large sums; in Python handle deep recursion or use iterative logic; in JS use BigInt when needed.
4. DRY RUN: Verify boundary checks (< vs <=, 0-indexing) against sample test cases before outputting code.
5. SIGNATURE: Match the exact LeetCode class Solution and method signatures. Return ONLY raw JSON matching this schema:
{
  "problemSummary": "Summary",
  "algorithm": "Detailed intuition and dry-run trace",
  "correctness": "Proof of invariants",
  "code": "Ready-to-run solution code",
  "language": "${request.targetLanguage}",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "edgeCases": ["Edge cases handled"],
  "assumptions": []
}`;

    const userPrompt = `Problem: ${request.problem.title} (${request.problem.difficulty})
Target Language: ${request.targetLanguage}
Statement:
${request.problem.statement}

Constraints:
${(request.problem.constraints || []).join('\n')}

Starter Code:
${request.problem.starterCode || ''}

Action: ${request.action}`;

    const payload = {
      model: cleanModel,
      messages: [
        { role: isReasoning ? 'developer' : 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    if (!isReasoning) {
      payload.temperature = 0.1;
      payload.response_format = { type: 'json_object' };
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      let msg = `OpenAI returned HTTP ${resp.status}`;
      try {
        const j = JSON.parse(errText);
        if (j.error?.message) msg = j.error.message;
      } catch {}
      throw new Error(msg);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response choice from OpenAI');
    return JSON.parse(raw);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function handleTest(body) {
  const { provider, model, apiKeyOverride } = body;
  const start = Date.now();

  if (provider === 'gemini') {
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, message: 'GEMINI_API_KEY missing in local server environment' };
    }
    const cleanModel = (model || 'gemini-4-argon').replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with {"status":"ok"}' }] }],
        generationConfig: { maxOutputTokens: 20, responseMimeType: 'application/json' }
      })
    });

    const latencyMs = Date.now() - start;
    if (!resp.ok) {
      const err = await resp.text();
      return { success: false, message: `Gemini test failed (${resp.status}): ${err.substring(0, 150)}`, latencyMs };
    }
    return { success: true, message: `Connected to Gemini (${cleanModel}) via local backend in ${latencyMs}ms!`, latencyMs, testedModel: cleanModel };
  } else if (provider === 'openai') {
    const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, message: 'OPENAI_API_KEY missing in local server environment' };
    }
    const cleanModel = model || 'gpt-6-astra';
    const resp = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const latencyMs = Date.now() - start;
    if (!resp.ok) {
      const err = await resp.text();
      return { success: false, message: `OpenAI test failed (${resp.status}): ${err.substring(0, 150)}`, latencyMs };
    }
    return { success: true, message: `Connected to OpenAI (${cleanModel}) via local backend in ${latencyMs}ms!`, latencyMs, testedModel: cleanModel };
  }

  return { success: false, message: `Unknown provider: ${provider}` };
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    const providersConfigured = [];
    if (process.env.GEMINI_API_KEY) providersConfigured.push('gemini');
    if (process.env.OPENAI_API_KEY) providersConfigured.push('openai');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      providersConfigured,
      hasGemini: !!process.env.GEMINI_API_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    }));
    return;
  }

  if (url.pathname === '/api/test' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        const result = await handleTest(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/generate' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        const solution = await handleGenerate(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: solution }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`[LeetCode AI Copilot] Local backend proxy active on http://localhost:${PORT}`);
  console.log(`[LeetCode AI Copilot] Keys loaded from environment: Gemini=${!!process.env.GEMINI_API_KEY}, OpenAI=${!!process.env.OPENAI_API_KEY}`);
});
