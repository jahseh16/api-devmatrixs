// ═══════════════════════════════════════════════════════════
// routes/keys.route.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const ApiKey  = require('../models/ApiKey');

const JWT_SECRET = process.env.JWT_SECRET || 'devmatrixs_secret';

// ── Middleware: verificar JWT ─────────────────────────────
function authRequired(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ ok: false, error: 'Token requerido.' });

  try {
    const token   = authHeader.replace('Bearer ', '');
    req.user      = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado.' });
  }
}

// ── POST /api/keys/generate ───────────────────────────────
// Genera una nueva API Key para el usuario autenticado
router.post('/generate', authRequired, async (req, res) => {
  try {
    // Límite: máximo 3 keys por usuario plan free
    const existing = await ApiKey.find({ userId: req.user.id, isActive: true });
    const limit    = req.user.plan === 'pro' ? 10 : 3;

    if (existing.length >= limit) {
      return res.status(429).json({
        ok: false,
        error: `Límite de ${limit} API Keys alcanzado para tu plan ${req.user.plan}.`,
      });
    }

    const key = 'dmx-' + crypto.randomBytes(24).toString('hex');

    const apiKey = await ApiKey.create({
      key,
      userId:   req.user.id,
      username: req.user.username,
      plan:     req.user.plan,
    });

    res.status(201).json({
      ok:      true,
      message: 'API Key generada exitosamente.',
      apiKey: {
        id:        apiKey._id,
        key:       apiKey.key,
        plan:      apiKey.plan,
        isActive:  apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (err) {
    console.error('❌ generate key error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── GET /api/keys/list ────────────────────────────────────
// Lista todas las API Keys del usuario autenticado
router.get('/list', authRequired, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user.id })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      ok:    true,
      total: keys.length,
      keys,
    });
  } catch (err) {
    console.error('❌ list keys error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── DELETE /api/keys/:id ──────────────────────────────────
// Desactiva (revoca) una API Key del usuario autenticado
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({ _id: req.params.id, userId: req.user.id });

    if (!apiKey) {
      return res.status(404).json({ ok: false, error: 'API Key no encontrada.' });
    }

    apiKey.isActive = false;
    await apiKey.save();

    res.json({ ok: true, message: 'API Key revocada exitosamente.' });
  } catch (err) {
    console.error('❌ delete key error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

module.exports = router;
