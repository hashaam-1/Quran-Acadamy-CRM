const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    trim: true
  },
  meetingNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  teacherId: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  teacherName: {
    type: String,
    required: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  date: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  },
  endTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  course: {
    type: String,
    required: true
  },
  zoomMeetingId: {
    type: String,
    required: true
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
  zoomHostKey: {
    type: String
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.Mixed
    },
    name: String,
    role: {
      type: Number,
      enum: [0, 1], // 0 = Participant, 1 = Host
      default: 0
    },
    joinTime: Date,
    leaveTime: Date
  }],
  recording: {
    enabled: {
      type: Boolean,
      default: false
    },
    files: [{
      url: String,
      size: Number,
      duration: Number
    }]
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
meetingSchema.index({ teacherId: 1, date: 1 });
meetingSchema.index({ status: 1 });
// meetingNumber already has unique: true in schema, no need for separate index

module.exports = mongoose.model('Meeting', meetingSchema);
