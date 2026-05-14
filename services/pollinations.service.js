// ═══════════════════════════════════════════════════════════
// services/pollinations.service.js
// Chat e imagen con Pollinations.ai (sin API key)
// ═══════════════════════════════════════════════════════════

async function callPollinationsChat({ messages, model = 'openai', stream = false, maxTokens = 1024 }) {
  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      stream,
    }),
  });
  if (!res.ok) throw new Error(`Pollinations chat error: ${res.status}`);
  return res;
}

async function generateImage({ prompt, width = 1024, height = 1024, model = 'flux', seed, nologo = true }) {
  const params = new URLSearchParams({
    width:  String(width),
    height: String(height),
    model,
    nologo: String(nologo),
    ...(seed ? { seed: String(seed) } : {}),
  });
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params}`;
  return { url };
}

module.exports = { callPollinationsChat, generateImage };
