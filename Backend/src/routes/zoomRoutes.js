const express = require('express');
const { generateSignature, createMeeting, getMeetingInfo } = require('../controllers/zoomController');

const router = express.Router();

// Generate Zoom signature for meeting SDK
router.post('/signature', generateSignature);

// Create a new meeting (optional)
router.post('/meeting', createMeeting);

// Get meeting information
router.get('/meeting/:meetingNumber', getMeetingInfo);

module.exports = router;
