const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true }, // e.g. JOB-2025-0047
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  shopOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  // Device Details
  deviceType: { type: String, enum: ['Mobile', 'Laptop'], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, default: '' },
  identifier: { type: String, default: '' }, // IMEI or Serial Number
  
  // Repair Details
  repairCategory: { type: String, default: '' }, // e.g., Hardware, Software, Both
  reportedIssue: [{ type: String }], // Array of tags
  deviceCondition: { type: String, default: '' }, // Pre-existing damage
  technicianDiagnosis: { type: String, default: '' }, // Technician's finding
  technicianNotes: { type: String, default: '' }, // Internal only
  partsRequired: [{ type: String }],
  
  // Status and Tracking
  status: { 
    type: String, 
    enum: [
      'Received', 'Under Diagnosis', 'Waiting for Parts', 'Repair in Progress', 
      'Quality Check', 'Ready for Pickup', 'Delivered / Closed', 'Cannot be Repaired', 'On Hold'
    ],
    default: 'Received'
  },
  statusHistory: [statusHistorySchema],
  
  // Financials
  estimatedCost: { type: Number, default: 0 },
  finalCost: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  
  priority: { type: String, enum: ['normal', 'urgent', 'vip'], default: 'normal' },
  
  // Dates
  receivedDate: { type: Date, default: Date.now },
  estimatedDelivery: { type: Date },
  completedDate: { type: Date },
  deliveredDate: { type: Date },
  
  // WhatsApp tracking
  lastMessageSent: { type: Date },
  messagesSentCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);
