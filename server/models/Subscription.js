const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true
  },
  plan: { 
    type: String, 
    enum: ['starter', 'business', 'advanced', 'mobile_app'], 
    default: 'starter',
    required: true
  },
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
    default: 'monthly',
    required: true
  },
  setupFeePaid: { type: Number },
  amountPaid: { type: Number },
  startDate: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'suspended', 'trial'], 
    default: 'trial' 
  },
  paymentMethod: { type: String },
  transactionId: { type: String },
  adminNotes: { type: String },
  renewalHistory: [{
    renewedOn: Date,
    plan: String,
    cycle: String,
    amount: Number,
    endDate: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
