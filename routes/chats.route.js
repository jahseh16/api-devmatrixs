// ═══════════════════════════════════════════════════════════
// routes/chats.route.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Chat    = require('../models/Chat');

const JWT_SECRET = process.env.JWT_SECRET || 'devmatrixs_secret';

// ── Middleware JWT ──────────────────────────────────────────
function authRequired(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ ok: false, error: 'Token requerido.' });
  try {
    req.user = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado.' });
  }
}

// ── POST /api/chats ────────────────────────────═══════════
// Crea o actualiza un chat. Si viene chatId, agrega mensajes al existente.
// Body: { messages, model?, title?, chatId? }
router.post('/', authRequired, async (req, res) => {
  try {
    const { messages, model, title, chatId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: 'messages es requerido y debe ser un array.' });
    }

    let chat;

    if (chatId) {
      // Actualizar chat existente
      chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
      if (!chat) return res.status(404).json({ ok: false, error: 'Chat no encontrado.' });
      chat.messages.push(...messages);
      if (title)  chat.title = title;
      if (model)  chat.model = model;
    } else {
      // Crear nuevo chat
      chat = new Chat({
        userId:   req.user.id,
        username: req.user.username,
        model:    model ?? 'gpt-4o-mini',
        messages,
      });
      if (title) {
        chat.title = title;
      } else {
        chat.autoTitle();
      }
    }

    await chat.save();

    res.status(chatId ? 200 : 201).json({
      ok:   true,
      chat: {
        id:        chat._id,
        title:     chat.title,
        model:     chat.model,
        messages:  chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (err) {
    console.error('❌ save chat error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── GET /api/chats ───────────────────────────────────────
// Lista todos los chats del usuario (sin mensajes para ahorrar peso)
router.get('/', authRequired, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .select('title model createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ ok: true, total: chats.length, chats });
  } catch (err) {
    console.error('❌ list chats error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── GET /api/chats/:id ───────────────────────────────────
// Obtiene un chat completo con todos sus mensajes
router.get('/:id', authRequired, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ ok: false, error: 'Chat no encontrado.' });
    res.json({ ok: true, chat });
  } catch (err) {
    console.error('❌ get chat error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

// ── DELETE /api/chats/:id ────────────────────────────────
// Elimina un chat del usuario
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ ok: false, error: 'Chat no encontrado.' });
    res.json({ ok: true, message: 'Chat eliminado.' });
  } catch (err) {
    console.error('❌ delete chat error:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
  }
});

module.exports = router;
