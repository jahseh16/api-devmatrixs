// ═══════════════════════════════════════════════════════════
// models/User.js
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  plan:      { type: String, default: 'free', enum: ['free', 'pro'] },
  isActive:  { type: Boolean, default: true },
  requests:  { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Hash password antes de guardar
// NOTA: sin parámetro next — Mongoose 6.5+ soporta async puro sin callback
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Método para comparar password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// No exponer password en JSON
userSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.password;
    return obj;
  },
});

module.exports = mongoose.model('User', userSchema);
