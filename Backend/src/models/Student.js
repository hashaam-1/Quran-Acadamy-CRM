const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 4,
    max: 100
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  timezone: {
    type: String,
    required: true,
    default: 'GMT+0'
  },
  course: {
    type: String,
    required: true,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed']
  },
  teacher: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  plainPassword: {
    type: String,
  },
  userId: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'on_hold'],
    default: 'active'
  },
  feeAmount: {
    type: Number,
    default: 100
  },
  leaveReason: {
    type: String,
    default: ''
  },
  documents: [{
    type: String
  }],
  startDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
studentSchema.index({ status: 1 });
studentSchema.index({ teacherId: 1 });
studentSchema.index({ course: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
