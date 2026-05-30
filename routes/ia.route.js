// ═══════════════════════════════════════════════════════════
// routes/ia.route.js
// API Pública de IA — requiere x-api-key
// Rutas montadas bajo /api/ia en server.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { chat, models } = require('../controllers/aiController');
const auth    = require('../middleware/auth');

// Rate limiting por IP (capa extra sobre el límite de plan)
const requestCounts = new Map();
function rateLimit(req, res, next) {
  const ip  = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const key = `${ip}-${Math.floor(now / 60000)}`;

  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);

  if (requestCounts.size > 1000) {
    const cutoff = Math.floor(now / 60000) - 2;
    for (const k of requestCounts.keys()) {
      if (parseInt(k.split('-').pop()) < cutoff) requestCounts.delete(k);
    }
  }

  if (count > 30) {
    return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Espera un momento.' });
  }
  next();
}

// POST /api/ia/chat  — enviar mensaje (x-api-key requerida)
router.post('/chat', auth, rateLimit, chat);

// GET  /api/ia/models — listar modelos disponibles (x-api-key requerida)
router.get('/models', auth, models);

module.exports = router;
