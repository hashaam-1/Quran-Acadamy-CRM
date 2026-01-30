const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // User type: 'student' or 'teacher'
  userType: {
    type: String,
    enum: ['student', 'teacher'],
    required: true,
  },
  // For student attendance
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  studentName: {
    type: String,
  },
  // For teacher attendance or student's teacher
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  teacherName: {
    type: String,
  },
  course: {
    type: String,
  },
  // Schedule reference for linking attendance to scheduled classes
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
  },
  // Scheduled class time from schedule
  scheduledTime: {
    type: String,
  },
  // Day of the week for the class
  scheduledDay: {
    type: String,
  },
  // Duration of the class
  duration: {
    type: String,
  },
  classTime: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present',
  },
  checkInTime: {
    type: String,
  },
  checkOutTime: {
    type: String,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ teacherId: 1, date: -1 });
attendanceSchema.index({ date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
