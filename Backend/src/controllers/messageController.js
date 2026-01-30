const Message = require('../models/Message.js');
const Conversation = require('../models/Conversation.js');

// Get all conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single conversation
module.exports. getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create conversation
module.exports. createConversation = async (req, res) => {
  try {
    const conversation = new Conversation(req.body);
    const newConversation = await conversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get messages by conversation
module.exports. getMessagesByConversation = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send message
module.exports. sendMessage = async (req, res) => {
  try {
    const message = new Message(req.body);
    const newMessage = await message.save();
    
    // Update conversation
    await Conversation.findByIdAndUpdate(
      req.body.conversationId,
      {
        lastMessage: req.body.content,
        time: req.body.time,
        $inc: { unread: req.body.sender === 'them' ? 1 : 0 }
      }
    );
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark conversation as read
module.exports. markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { unread: 0 },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Update all messages in conversation to read
    await Message.updateMany(
      { conversationId: req.params.id, sender: 'them' },
      { status: 'read' }
    );
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete conversation
module.exports. deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Delete all messages in conversation
    await Message.deleteMany({ conversationId: req.params.id });
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
