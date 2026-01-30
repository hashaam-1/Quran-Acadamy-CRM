const express = require('express');
const {
  getUserChats,
  getChatById,
  createChat,
  sendMessage,
  markAsRead,
  getChatStats,
  deleteChat,
} = require('../controllers/chatController.js');

const router = express.Router();

router.get('/', getUserChats);
router.get('/stats', getChatStats);
router.get('/:id', getChatById);
router.post('/', createChat);
router.post('/:chatId/message', sendMessage);
router.post('/:chatId/read', markAsRead);
router.delete('/:id', deleteChat);

module.exports = router;
