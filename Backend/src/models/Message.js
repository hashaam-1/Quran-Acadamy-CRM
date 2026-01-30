const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['me', 'them'],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
