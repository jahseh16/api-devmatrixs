// ═══════════════════════════════════════════════════════════
// controllers/aiController.js
// Controlador principal de IA — soporta SambaNova y Groq
// con fallback automático y streaming SSE
// ═══════════════════════════════════════════════════════════

const { callSambaNova } = require('../services/sambanova.service');
const { callGroq }      = require('../services/groq.service');

// ── Configuración global ──────────────────────────────────
const MAX_MESSAGES  = 20;    // máximo de mensajes en el contexto
const MAX_TOKENS    = 1024;  // máximo de tokens de salida
const DEFAULT_MODEL = 'deepseek-v3-cb';  // modelo por defecto (barato y bueno)

/**
 * POST /api/ai/chat
 * Body: { messages, model?, provider?, stream? }
 *
 * providers disponibles: 'sambanova' | 'groq' | 'auto'
 * 'auto' → intenta SambaNova primero, si falla usa Groq
 */
async function chat(req, res) {
  try {
    const {
      messages,
      model    = DEFAULT_MODEL,
      provider = 'auto',
      stream   = false,
    } = req.body;

    // ── Validaciones básicas ──────────────────────────────
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se requiere un array de messages no vacío.' });
    }

    // Limitar contexto para no gastar tokens de más
    const context = messages.slice(-MAX_MESSAGES);

    // ── Streaming SSE ─────────────────────────────────────
    if (stream) {
      res.setHeader('Content-Type',  'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection',    'keep-alive');
      res.flushHeaders();

      try {
        const response = await _callProvider({ provider, messages: context, model, stream: true, maxTokens: MAX_TOKENS });
        // Pipe directo del stream de la API al cliente
        for await (const chunk of response.body) {
          res.write(chunk);
        }
      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }
      return res.end();
    }

    // ── Respuesta completa (no streaming) ─────────────────
    const response = await _callProvider({ provider, messages: context, model, stream: false, maxTokens: MAX_TOKENS });
    const data     = await response.json();

    const content    = data.choices?.[0]?.message?.content ?? '';
    const usage      = data.usage ?? {};
    const usedModel  = data.model ?? model;

    return res.json({
      ok:       true,
      content,
      model:    usedModel,
      provider: data._provider ?? provider,
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

/**
 * Devuelve todos los modelos disponibles por provider
 * GET /api/ai/models
 */
function models(req, res) {
  const { SAMBANOVA_MODELS } = require('../services/sambanova.service');
  const { GROQ_MODELS }      = require('../services/groq.service');
  res.json({
    ok: true,
    providers: {
      sambanova: Object.keys(SAMBANOVA_MODELS),
      groq:      Object.keys(GROQ_MODELS),
    },
  });
}

// ── Helper interno: selecciona provider con fallback ──────
async function _callProvider({ provider, messages, model, stream, maxTokens }) {
  if (provider === 'groq') {
    return callGroq({ messages, model: 'llama3-70b', stream, maxTokens });
  }

  if (provider === 'sambanova') {
    return callSambaNova({ messages, model, stream, maxTokens });
  }

  // 'auto': intenta SambaNova primero, fallback a Groq
  try {
    return await callSambaNova({ messages, model, stream, maxTokens });
  } catch (errSamba) {
    console.warn('[aiController] SambaNova falló, usando Groq como fallback:', errSamba.message);
    return callGroq({ messages, model: 'llama3-70b', stream, maxTokens });
  }
}

module.exports = { chat, models };
