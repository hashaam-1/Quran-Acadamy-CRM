const mongoose = require('mongoose');

const rescheduleRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: String,
    required: true
  },
  newTime: {
    type: String,
    required: true
  },
  newDay: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  course: {
    type: String,
    required: true,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed']
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  rescheduleRequest: rescheduleRequestSchema,
  // Unique meeting number for this specific class (CRITICAL for preventing host conflicts)
  meetingNumber: {
    type: String,
    unique: true,
    sparse: true // Allows null values for schedules without meetings yet
  },
  // Zoom meeting fields for scheduled classes
  zoomMeetingId: {
    type: String
  },
  zoomPassword: {
    type: String,
    default: ''
  },
  zoomJoinUrl: {
    type: String
  },
  zoomStartUrl: {
    type: String
  },
  meetingStatus: {
    type: String,
    enum: ['not_created', 'created', 'started', 'ended'],
    default: 'not_created'
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ day: 1 });
scheduleSchema.index({ teacherId: 1 });
scheduleSchema.index({ studentId: 1 });
scheduleSchema.index({ status: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
