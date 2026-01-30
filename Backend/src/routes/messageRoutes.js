const express = require('express');
const {
  getConversations,
  getConversationById,
  createConversation,
  getMessagesByConversation,
  sendMessage,
  markAsRead,
  deleteConversation
} = require('../controllers/messageController.js');

const router = express.Router();

router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);
router.put('/conversations/:id/mark-read', markAsRead);
router.get('/conversations/:conversationId/messages', getMessagesByConversation);
router.post('/messages', sendMessage);

module.exports = router;
