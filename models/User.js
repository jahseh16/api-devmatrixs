// ═══════════════════════════════════════════════════════════
// models/User.js
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type:      String,
    required:  true,
    unique:    true,
    trim:      true,
    minlength: 3,
    maxlength: 32,
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
  },
  password: {
    type:     String,
    required: true,
    minlength: 6,
  },
  plan: {
    type:    String,
    enum:    ['free', 'pro'],
    default: 'free',
  },
  requests: { type: Number, default: 0 },
  coins:    { type: Number, default: 0 },
}, { timestamps: true });

// Middleware pre-save asíncrono puro (sin next)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
