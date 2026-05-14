// ═══════════════════════════════════════════════════════════
// models/ApiKey.js
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  key:           { type: String, required: true, unique: true },
  userId:        { type: String, required: true },
  username:      { type: String, required: true },
  plan:          { type: String, default: 'free', enum: ['free', 'pro'] },
  requestsToday: { type: Number, default: 0 },
  totalRequests: { type: Number, default: 0 },
  lastReset:     { type: Date,   default: Date.now },
  isActive:      { type: Boolean, default: true },
  createdAt:     { type: Date,   default: Date.now },
});

module.exports = mongoose.model('ApiKey', apiKeySchema);
