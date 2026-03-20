const mongoose = require('mongoose');

/**
 * Stores Baileys auth state (creds + signal keys) in MongoDB.
 * One document per key per user session.
 */
const whatsAppAuthSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
});

// Compound unique index: one key per session
whatsAppAuthSchema.index({ sessionId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('WhatsAppAuth', whatsAppAuthSchema);
