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
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Rutas ─────────────────────────────────────────────────
app.use('/api',        require('./routes/download'));
app.use('/api/ai',     require('./routes/ai.route'));
app.use('/api/image',  require('./routes/image.route'));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'API DevMatrixs 🚀',
    version: '2.2.0',
    endpoints: {
      ai_chat:   'POST /api/ai/chat',
      ai_models: 'GET  /api/ai/models',
      image:     'POST /api/image',
      download:  'POST /api/download',
    },
    auth: 'Requiere x-api-key. Obtener en devmatrixs.lat',
  });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API DevMatrixs v2.2 corriendo en puerto ${PORT}`);
});
