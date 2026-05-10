const express = require('express');
const app = express();
const PORT = process.env.PORT || 2090;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rutas
app.use('/api', require('./routes/download'));

// Health check — sin exponer puerto ni info interna
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API DevMatrixs 🚀' });
});

app.listen(PORT, () => {
  console.log(`🚀 API DevMatrixs corriendo en puerto ${PORT}`);
});
