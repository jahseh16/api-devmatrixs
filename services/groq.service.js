// ═══════════════════════════════════════════════════════════
// services/groq.service.js
// Servicio de Groq — fallback rápido y gratuito
// ═══════════════════════════════════════════════════════════

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Modelos disponibles en Groq ───────────────────────────
const GROQ_MODELS = {
  'llama3-8b':   'llama3-8b-8192',
  'llama3-70b':  'llama3-70b-8192',
  'mixtral':     'mixtral-8x7b-32768',
  'gemma2':      'gemma2-9b-it',
};

/**
 * Llama a Groq API
 * @param {Array}  messages  - Array de { role, content }
 * @param {string} model     - Clave del modelo (ver GROQ_MODELS)
 * @param {boolean} stream   - true para SSE streaming
 * @param {number} maxTokens - Límite de tokens de salida
 * @returns {Response} fetch Response
 */
async function callGroq({ messages, model = 'llama3-70b', stream = false, maxTokens = 1024 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada en .env');

  const modelId = GROQ_MODELS[model] || model;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      modelId,
      messages,
      stream,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  return response;
}

module.exports = { callGroq, GROQ_MODELS };
