const express = require('express');
const router = express.Router();
const { handleDownload } = require('../controllers/downloadController');

// GET /api/download?url=<link>
router.get('/download', handleDownload);

module.exports = router;
