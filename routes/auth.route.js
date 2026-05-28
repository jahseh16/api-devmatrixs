// ═══════════════════════════════════════════════════════════
// routes/auth.route.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'devmatrix_secret_fallback';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function userPublic(user) {
  return {
    id:       user._id,
    username: user.username,
    email:    user.email,
    plan:     user.plan,
    requests: user.requests,
    coins:    user.coins,
  };
}

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'username, email y password son requeridos.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ ok: false, error: 'El username debe tener mínimo 3 caracteres.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener mínimo 6 caracteres.' });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email ? 'email' : 'username';
      return res.status(409).json({ ok: false, error: `El ${field} ya está en uso.` });
    }

    const user  = await User.create({ username, email, password });
    const token = signToken(user);

    return res.status(201).json({ ok: true, token, user: userPublic(user) });

  } catch (err) {
    console.error('[auth/register]', err.message);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'email y password son requeridos.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas.' });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: userPublic(user) });

  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ ok: false, error: 'Token requerido.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(payload.id).select('-password');
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });
    }

    return res.json({ ok: true, user: userPublic(user) });

  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Token inválido o expirado.' });
  }
});

module.exports = router;
