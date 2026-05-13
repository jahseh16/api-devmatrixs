// ═══════════════════════════════════════════════════════════
// services/sambanova.service.js
// Servicio de SambaNova — listo para agregar más providers
// ═══════════════════════════════════════════════════════════

const SAMBANOVA_URL = 'https://api.sambanova.ai/v1/chat/completions';

// ── Modelos disponibles en SambaNova ──────────────────────
const SAMBANOVA_MODELS = {
  'deepseek-v3':     'DeepSeek-V3.1',
  'deepseek-v3-cb':  'DeepSeek-V3.1-cb',   // más barato, casi igual de bueno
  'deepseek-r1':     'DeepSeek-R1-Distill-Llama-70B',
};

/**
 * Llama a SambaNova API
 * @param {Array}  messages  - Array de { role, content }
 * @param {string} model     - Clave del modelo (ver SAMBANOVA_MODELS)
 * @param {boolean} stream   - true para SSE streaming
 * @param {number} maxTokens - Límite de tokens de salida
 * @returns {Response} fetch Response (para streaming o json)
 */
async function callSambaNova({ messages, model = 'deepseek-v3-cb', stream = false, maxTokens = 1024 }) {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) throw new Error('SAMBANOVA_API_KEY no configurada en .env');

  const modelId = SAMBANOVA_MODELS[model] || model;

  const response = await fetch(SAMBANOVA_URL, {
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
    throw new Error(`SambaNova error ${response.status}: ${err}`);
  }

  return response;
}

module.exports = { callSambaNova, SAMBANOVA_MODELS };
