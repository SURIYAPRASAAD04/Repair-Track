const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  customerPhone: { type: String, required: true },
  customerName: { type: String },
  messageContent: { type: String, required: true },
  triggerEvent: { type: String },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  errorReason: { type: String },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MessageLog', messageLogSchema);
