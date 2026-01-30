const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  title: {
    type: String,
    required: true,
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
    lowercase: true,
    unique: true
  },
  specialization: [{
    type: String,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed']
  }],
  students: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  classesToday: {
    type: Number,
    default: 0
  },
  classesCompleted: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'in_class', 'on_leave'],
    default: 'available'
  },
  performance: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  punctuality: {
    type: Number,
    default: 90,
    min: 0,
    max: 100
  },
  completionRate: {
    type: Number,
    default: 0,
  },
  userId: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  plainPassword: {
    type: String,
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

// Indexes
teacherSchema.index({ status: 1 });
teacherSchema.index({ email: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
