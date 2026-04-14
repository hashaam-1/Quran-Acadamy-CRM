const Chat = require('../models/Chat.js');
const { filterMessage, sanitizeMessage } = require('../utils/messageFilter.js');

// Get all chats for a user based on their role
exports.getUserChats = async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }

    let query = {};

    // Admin can see all chats
    if (role === 'admin') {
      query = { isActive: true };
    } else {
      // Other users can only see chats they're part of
      query = {
        'participants.userId': userId,
        isActive: true,
      };
    }

    const chats = await Chat.find(query)
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(100);

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific chat by ID
module.exports. getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.query;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user has access to this chat
    if (role !== 'admin') {
      const isParticipant = chat.participants.some(
        p => p.userId.toString() === userId
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new chat
module.exports. createChat = async (req, res) => {
  try {
    const { participants, chatType } = req.body;

    // Validate participants
    if (!participants || participants.length < 2) {
      return res.status(400).json({ message: 'At least 2 participants required' });
    }

    // Check if chat already exists between these participants
    const existingChat = await Chat.findOne({
      chatType,
      'participants.userId': { $all: participants.map(p => p.userId) },
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = new Chat({
      participants,
      chatType,
      messages: [],
    });

    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send message
module.exports. sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, senderModel, senderName, senderRole, content } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Sanitize message
    const sanitizedContent = sanitizeMessage(content);

    // Filter message for contact information (except admin)
    const filterResult = filterMessage(sanitizedContent, senderRole);

    if (!filterResult.allowed) {
      return res.status(403).json({
        message: 'Message blocked',
        reason: filterResult.reason,
        blocked: true,
      });
    }

    // Create message object
    const message = {
      senderId,
      senderModel,
      senderName,
      senderRole,
      content: filterResult.filteredMessage,
      timestamp: new Date(),
      readBy: [{ userId: senderId, readAt: new Date() }],
    };

    // Add message to chat
    chat.messages.push(message);

    // Update last message
    chat.lastMessage = {
      content: filterResult.filteredMessage,
      timestamp: new Date(),
      senderId,
    };

    await chat.save();

    res.json({
      success: true,
      message: chat.messages[chat.messages.length - 1],
      chat,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark messages as read
module.exports. markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark all unread messages as read
    chat.messages.forEach(message => {
      const alreadyRead = message.readBy.some(
        r => r.userId.toString() === userId
      );

      if (!alreadyRead) {
        message.readBy.push({
          userId,
          readAt: new Date(),
        });
      }
    });

    await chat.save();

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get chat statistics for admin
module.exports. getChatStats = async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments({ isActive: true });
    
    const chatsByType = await Chat.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$chatType', count: { $sum: 1 } } },
    ]);

    const recentMessages = await Chat.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$messages' },
      { $sort: { 'messages.timestamp': -1 } },
      { $limit: 10 },
      {
        $project: {
          senderName: '$messages.senderName',
          content: '$messages.content',
          timestamp: '$messages.timestamp',
          isBlocked: '$messages.isBlocked',
        },
      },
    ]);

    const blockedMessages = await Chat.aggregate([
      { $unwind: '$messages' },
      { $match: { 'messages.isBlocked': true } },
      { $count: 'total' },
    ]);

    res.json({
      totalChats,
      chatsByType,
      recentMessages,
      blockedMessagesCount: blockedMessages[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete chat (admin only)
module.exports. deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
