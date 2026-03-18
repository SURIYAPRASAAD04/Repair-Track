const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  shopOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  totalJobs: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: { type: Date },
  notes: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure a phone number is unique per shop owner, but can exist across different shops
customerSchema.index({ phone: 1, shopOwnerId: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
