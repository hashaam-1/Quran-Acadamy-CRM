const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['student', 'teacher', 'team_leader'],
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  unread: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

conversationSchema.index({ type: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
