// ═══════════════════════════════════════════════════════════
// routes/image.route.js
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const { image } = require('../controllers/imageController');
const auth    = require('../middleware/auth');

// POST /api/image — generar imagen con Pollinations
router.post('/', auth, image);

module.exports = router;
