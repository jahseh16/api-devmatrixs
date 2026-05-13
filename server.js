// ═══════════════════════════════════════════════════════════
// server.js — API DevMatrixs
// ═══════════════════════════════════════════════════════════

const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 2090;

app.use(express.json({ limit: '1mb' }));

// ── CORS ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Rutas ─────────────────────────────────────────────────
app.use('/api',    require('./routes/download'));
app.use('/api/ai', require('./routes/ai.route'));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'API DevMatrixs 🚀',
    version: '2.0.0',
    endpoints: {
      download: 'POST /api/download',
      ai_chat:  'POST /api/ai/chat',
      ai_models:'GET  /api/ai/models',
    },
  });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API DevMatrixs v2 corriendo en puerto ${PORT}`);
});
