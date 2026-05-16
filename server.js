// ═══════════════════════════════════════════════════════════
// server.js — API DevMatrixs
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const app      = express();
const PORT     = process.env.PORT || 3001;

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
app.use('/api',        require('./routes/download'));
app.use('/api/ai',     require('./routes/ai.route'));
app.use('/api/image',  require('./routes/image.route'));
app.use('/api/auth',   require('./routes/auth.route'));
app.use('/api/keys',   require('./routes/keys.route'));
app.use('/api/chats',  require('./routes/chats.route'));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'API DevMatrixs 🚀',
    version: '2.4.0',
    endpoints: {
      ai_chat:        'POST   /api/ai/chat',
      ai_models:      'GET    /api/ai/models',
      image:          'POST   /api/image',
      download:       'POST   /api/download',
      auth_register:  'POST   /api/auth/register',
      auth_login:     'POST   /api/auth/login',
      auth_me:        'GET    /api/auth/me',
      keys_generate:  'POST   /api/keys/generate',
      keys_list:      'GET    /api/keys/list',
      keys_delete:    'DELETE /api/keys/:id',
      chats_save:     'POST   /api/chats',
      chats_list:     'GET    /api/chats',
      chats_get:      'GET    /api/chats/:id',
      chats_delete:   'DELETE /api/chats/:id',
    },
    auth: 'Requiere x-api-key o JWT. Obtener en devmatrixs.lat/dashboard',
  });
});

// ── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API DevMatrixs v2.4 corriendo en puerto ${PORT}`);
});
