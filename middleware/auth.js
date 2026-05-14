// ═══════════════════════════════════════════════════════════
// middleware/auth.js
// Valida x-api-key y controla límites por plan
// ═══════════════════════════════════════════════════════════

const ApiKey = require('../models/ApiKey');

const LIMITS = {
  free: 50,
  pro:  1000,
};

module.exports = async (req, res, next) => {
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({
      ok: false,
      error: 'API Key requerida.',
      help:  'Genera tu key gratis en https://devmatrixs.lat',
    });
  }

  try {
    const apiKey = await ApiKey.findOne({ key, isActive: true });

    if (!apiKey) {
      return res.status(403).json({
        ok: false,
        error: 'API Key inválida o desactivada.',
        help:  'Verifica tu key en https://devmatrixs.lat/dashboard',
      });
    }

    // Reset diario automático
    const now       = new Date();
    const lastReset = new Date(apiKey.lastReset);
    if (now.toDateString() !== lastReset.toDateString()) {
      apiKey.requestsToday = 0;
      apiKey.lastReset     = now;
    }

    // Verificar límite del plan
    const limit = LIMITS[apiKey.plan] || LIMITS.free;
    if (apiKey.requestsToday >= limit) {
      return res.status(429).json({
        ok:    false,
        error: `Límite diario alcanzado (${limit} requests/${apiKey.plan}).`,
        usage: { today: apiKey.requestsToday, limit, plan: apiKey.plan },
        help:  'Actualiza tu plan en https://devmatrixs.lat/dashboard',
      });
    }

    // Incrementar contadores
    apiKey.requestsToday  += 1;
    apiKey.totalRequests  += 1;
    await apiKey.save();

    // Pasar info al request
    req.apiKey = apiKey;
    next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ ok: false, error: 'Error interno de autenticación.' });
  }
};
