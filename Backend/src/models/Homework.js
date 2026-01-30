const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
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
  course: {
    type: String,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending'
  },
  submittedDate: {
    type: Date
  },
  submissionNotes: {
    type: String
  },
  grade: {
    type: String,
    enum: ['excellent', 'good', 'average', 'needs_improvement', '']
  },
  teacherFeedback: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for faster queries
homeworkSchema.index({ studentId: 1, status: 1 });
homeworkSchema.index({ teacherId: 1 });
homeworkSchema.index({ dueDate: 1 });

// Update status to overdue if past due date
homeworkSchema.pre('find', function() {
  const now = new Date();
  this.model.updateMany(
    { dueDate: { $lt: now }, status: { $in: ['pending', 'in_progress'] } },
    { status: 'overdue' }
  ).exec();
});

module.exports = mongoose.model('Homework', homeworkSchema);
