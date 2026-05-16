// ═══════════════════════════════════════════════════════════
// models/Chat.js
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, required: true, enum: ['user', 'assistant', 'system'] },
  content:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const chatSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  username:  { type: String, required: true },
  title:     { type: String, default: 'Nueva conversación' },
  model:     { type: String, default: 'gpt-4o-mini' },
  messages:  { type: [messageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Actualizar updatedAt al guardar
chatSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Auto-generar título del chat desde el primer mensaje del usuario
chatSchema.methods.autoTitle = function () {
  const first = this.messages.find(m => m.role === 'user');
  if (first) {
    this.title = first.content.slice(0, 60).trim();
  }
};

module.exports = mongoose.model('Chat', chatSchema);
