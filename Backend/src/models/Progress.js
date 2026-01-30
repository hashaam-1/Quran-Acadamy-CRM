const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  audioNote: {
    type: String
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
}, { _id: true });

const progressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  teacherName: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  lesson: {
    type: String,
    required: true
  },
  sabqi: {
    type: String,
    required: true
  },
  manzil: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  completion: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  homework: homeworkSchema
}, {
  timestamps: true
});

// Indexes
progressSchema.index({ studentId: 1 });
progressSchema.index({ date: -1 });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
