// ═══════════════════════════════════════════════════════════
// routes/ai.route.js
// Rutas del módulo de IA
// ═══════════════════════════════════════════════════════════

const express      = require('express');
const router       = express.Router();
const { chat, models } = require('../controllers/aiController');

// Rate limiting simple sin dependencias externas
const requestCounts = new Map();
function rateLimit(req, res, next) {
  const ip  = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const key = `${ip}-${Math.floor(now / 60000)}`; // ventana de 1 minuto

  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);

  // Limpiar entradas viejas cada 1000 requests
  if (requestCounts.size > 1000) {
    const cutoff = Math.floor(now / 60000) - 2;
    for (const k of requestCounts.keys()) {
      if (parseInt(k.split('-').pop()) < cutoff) requestCounts.delete(k);
    }
  }

  if (count > 30) { // máximo 30 requests por minuto por IP
    return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Espera un momento.' });
  }
  next();
}

// POST /api/ai/chat  — enviar mensaje y recibir respuesta
router.post('/chat', rateLimit, chat);

// GET  /api/ai/models — listar modelos disponibles
router.get('/models', models);

module.exports = router;
