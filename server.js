// ═══════════════════════════════════════════════════════════
// server.js — API DevMatrixs
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const app      = express();
const PORT     = process.env.PORT || 3002;

// ── MongoDB ───────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use(express.json({ limit: '1mb' }));

// ── CORS ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Rutas ─────────────────────────────────────────────────

// API Pública — requiere x-api-key
app.use('/api/ia',       require('./routes/ia.route'));
app.use('/api/download', require('./routes/download'));
app.use('/api/image',    require('./routes/image.route'));
app.use('/api/auth',     require('./routes/auth.route'));
app.use('/api/keys',     require('./routes/keys.route'));

// Web Interna — requiere JWT Bearer (Dashboard)
app.use('/chat',         require('./routes/chats.route'));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'API DevMatrixs 🚀',
    version: '2.5.0',
    endpoints: {
      // — API Pública (x-api-key) —
      ia_chat:        'POST   /api/ia/chat',
      ia_models:      'GET    /api/ia/models',
      image:          'POST   /api/image',
      download:       'POST   /api/download',
      download_get:   'GET    /api/download?url=',
      auth_register:  'POST   /api/auth/register',
      auth_login:     'POST   /api/auth/login',
      auth_me:        'GET    /api/auth/me',
      keys_generate:  'POST   /api/keys/generate',
      keys_list:      'GET    /api/keys/list',
      keys_delete:    'DELETE /api/keys/:id',
      // — Web Interna (JWT Bearer) —
      chat_save:      'POST   /chat',
      chat_list:      'GET    /chat',
      chat_get:       'GET    /chat/:id',
      chat_delete:    'DELETE /chat/:id',
    },
    auth: 'API pública requiere x-api-key. Dashboard interno requiere JWT Bearer.',
  });
});

// ── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API DevMatrixs v2.5 corriendo en puerto ${PORT}`);
});
