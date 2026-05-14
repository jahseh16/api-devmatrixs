// ═══════════════════════════════════════════════════════════
// controllers/imageController.js
// Generación de imágenes con Pollinations.ai
// ═══════════════════════════════════════════════════════════

const { generateImage } = require('../services/pollinations.service');

async function image(req, res) {
  try {
    const { prompt, width, height, model, seed } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Se requiere un prompt válido.' });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ ok: false, error: 'El prompt no puede superar 1000 caracteres.' });
    }

    const result = await generateImage({
      prompt: prompt.trim(),
      width:  width  || 1024,
      height: height || 1024,
      model:  model  || 'flux',
      seed,
    });

    return res.json({
      ok:     true,
      url:    result.url,
      prompt: prompt.trim(),
      model:  model || 'flux',
    });

  } catch (err) {
    console.error('[imageController] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { image };
