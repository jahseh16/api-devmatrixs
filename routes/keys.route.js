// ═══════════════════════════════════════════════════════════
// routes/keys.route.js
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const ApiKey   = require('../models/ApiKey');
const User     = require('../models/User');
const router   = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devmatrix_secret_fallback';

// ── Middleware: verificar JWT ──────────────────────────────
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'Autenticación requerida.' });

    const payload = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ ok: false, error: 'Usuario no encontrado.' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Token inválido o expirado.' });
  }
}

// ── POST /api/keys/generate ────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Límite: máximo 5 keys por usuario en plan free
    const count = await ApiKey.countDocuments({ userId });
    if (req.user.plan === 'free' && count >= 5) {
      return res.status(403).json({ ok: false, error: 'Límite de 5 API Keys alcanzado en el plan free.' });
    }

    const rawKey = 'mk-' + crypto.randomBytes(24).toString('hex');

    const apiKey = await ApiKey.create({
      key:      rawKey,
      userId,
      username: req.user.username,
      plan:     req.user.plan,
    });

    return res.status(201).json({
      ok:  true,
      key: {
        id:        apiKey._id,
        key:       rawKey,
        plan:      apiKey.plan,
        createdAt: apiKey.createdAt,
      },
    });

  } catch (err) {
    console.error('[keys/generate]', err.message);
    return res.status(500).json({ ok: false, error: 'Error generando la API Key.' });
  }
});

// ── GET /api/keys/list ─────────────────────────────────────
router.get('/list', requireAuth, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id })
      .select('key plan requests createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      ok:   true,
      keys: keys.map(k => ({
        id:        k._id,
        key:       k.key,
        plan:      k.plan,
        requests:  k.requests ?? 0,
        createdAt: k.createdAt,
      })),
    });

  } catch (err) {
    console.error('[keys/list]', err.message);
    return res.status(500).json({ ok: false, error: 'Error obteniendo las API Keys.' });
  }
});

// ── DELETE /api/keys/:id ───────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const key = await ApiKey.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!key) return res.status(404).json({ ok: false, error: 'Key no encontrada.' });
    return res.json({ ok: true, message: 'API Key eliminada.' });
  } catch (err) {
    console.error('[keys/delete]', err.message);
    return res.status(500).json({ ok: false, error: 'Error eliminando la API Key.' });
  }
});

module.exports = router;
