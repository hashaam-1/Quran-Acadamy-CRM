const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Student', 'Teacher', 'TeamMember'],
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'],
  },
  content: {
    type: String,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedReason: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  readBy: [{
    userId: String,
    readAt: Date,
  }],
});

const chatSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: String,
      required: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Student', 'Teacher', 'TeamMember'],
    },
    name: String,
    role: {
      type: String,
      enum: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'],
    },
  }],
  chatType: {
    type: String,
    enum: ['sales_to_team_lead', 'team_lead_to_teacher', 'teacher_to_student', 'admin_view'],
    required: true,
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
