// ═══════════════════════════════════════════════════════════
// controllers/aiController.js
// ═══════════════════════════════════════════════════════════

const { callSambaNova } = require('../services/sambanova.service');
const { callGroq }      = require('../services/groq.service');

const MAX_MESSAGES  = 20;
const MAX_TOKENS    = 1024;
const DEFAULT_MODEL = 'deepseek-v3-cb';

// Modelos públicos
const PUBLIC_MODELS = [
  'fast',       // llama rápido
  'balanced',   // deepseek equilibrado  
  'smart',      // deepseek más potente
  'creative',   // mixtral
  'reasoning',  // deepseek r1 (razonamiento)
];

// Mapa interno
const MODEL_MAP = {
  fast:      { provider: 'groq',      model: 'llama3-8b' },
  balanced:  { provider: 'sambanova', model: 'deepseek-v3-cb' },
  smart:     { provider: 'sambanova', model: 'deepseek-v3' },
  creative:  { provider: 'groq',      model: 'mixtral' },
  reasoning: { provider: 'sambanova', model: 'deepseek-r1' },  // <-- agrega esto
};

async function chat(req, res) {
  try {
    const {
      messages,
      model    = 'balanced',
      stream   = false,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se requiere un array de messages no vacío.' });
    }

    const context  = messages.slice(-MAX_MESSAGES);
    const resolved = MODEL_MAP[model] || MODEL_MAP['balanced'];

    if (stream) {
      res.setHeader('Content-Type',  'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection',    'keep-alive');
      res.flushHeaders();
      try {
        const response = await _callProvider({ ...resolved, messages: context, stream: true, maxTokens: MAX_TOKENS });
        for await (const chunk of response.body) res.write(chunk);
      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }
      return res.end();
    }

    const response = await _callProvider({ ...resolved, messages: context, stream: false, maxTokens: MAX_TOKENS });
    const data     = await response.json();
    const content  = data.choices?.[0]?.message?.content ?? '';
    const usage    = data.usage ?? {};

    return res.json({
      ok:      true,
      content,
      model,   // devuelve el nombre público, no el interno
      usage: {
        prompt_tokens:     usage.prompt_tokens     ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens:      usage.total_tokens      ?? 0,
      },
    });

  } catch (err) {
    console.error('[aiController] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// GET /api/ai/models — solo muestra nombres públicos
function models(req, res) {
  res.json({
    ok:     true,
    models: PUBLIC_MODELS,
    usage:  {
      today: req.apiKey?.requestsToday || 0,
      limit: req.apiKey?.plan === 'pro' ? 1000 : 50,
      plan:  req.apiKey?.plan || 'free',
    },
  });
}

async function _callProvider({ provider, messages, model, stream, maxTokens }) {
  if (provider === 'groq') {
    return callGroq({ messages, model, stream, maxTokens });
  }
  try {
    return await callSambaNova({ messages, model, stream, maxTokens });
  } catch (err) {
    console.warn('[aiController] SambaNova falló, fallback a Groq:', err.message);
    return callGroq({ messages, model: 'llama3-70b', stream, maxTokens });
  }
}

module.exports = { chat, models };
