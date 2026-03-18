const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  changedBy: { type: String, default: 'shop_owner' },
  note: { type: String },
  whatsappSent: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
