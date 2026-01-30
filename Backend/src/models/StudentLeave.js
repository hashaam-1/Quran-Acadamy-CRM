const mongoose = require('mongoose');

const studentLeaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Move to local Mosque',
      'Financial Constraints',
      'Too young',
      'Didn\'t attend the first trial class',
      'Not interested in E-learning',
      'Have another Account',
      'Prefer Home tutor',
      'Other reason (Not related to services)'
    ]
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

studentLeaveSchema.index({ date: -1 });
studentLeaveSchema.index({ reason: 1 });

const StudentLeave = mongoose.model('StudentLeave', studentLeaveSchema);

module.exports = StudentLeave;
