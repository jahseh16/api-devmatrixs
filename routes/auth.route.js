// ═══════════════════════════════════════════════════════════
// routes/auth.route.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devmatrixs_secret';

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'username, email y password son requeridos.' });
    }

    // Verificar si ya existe
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'El email o username ya está registrado.' });
    }

    const user = await User.create({ username, email, password });

    const token = jwt.sign(
      { id: user._id, username: user.username, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      ok: true,
      message: 'Cuenta creada exitosamente.',
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        plan:     user.plan,
      },
    });
  } catch (err) {
    console.error('❌ register error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'email y password son requeridos.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ ok: false, error: 'Cuenta desactivada.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      message: 'Login exitoso.',
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        plan:     user.plan,
      },
    });
  } catch (err) {
    console.error('❌ login error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ ok: false, error: 'Token requerido.' });

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });

    res.json({ ok: true, user });
  } catch (err) {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado.' });
  }
});

module.exports = router;
