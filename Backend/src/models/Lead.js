const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    required: true
  },
  outcome: {
    type: String,
    required: true
  }
}, { _id: true });

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed']
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'follow_up', 'trial', 'enrolled', 'closed'],
    default: 'new'
  },
  assignedTo: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  callLogs: [callLogSchema]
}, {
  timestamps: true
});

// Indexes for better query performance
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
