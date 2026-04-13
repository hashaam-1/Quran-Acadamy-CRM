const express = require('express');
const router = express.Router();
const {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails
} = require('../../controllers/meetingController');

console.log("MEETING ROUTES LOADED - All endpoints available");

// Fallback authentication middleware for testing
router.use((req, res, next) => {
  // Add mock user for testing if no auth middleware
  if (!req.user) {
    req.user = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'teacher'
    };
  }
  next();
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log("MEETING TEST ENDPOINT HIT");
  res.json({ 
    success: true, 
    message: 'Meeting routes are working',
    timestamp: new Date().toISOString()
  });
});

// Teacher routes
router.post('/start-class', startClass);
router.get('/teacher/meetings', getTeacherMeetings);
router.put('/end-class/:meetingNumber', endClass);

// Student routes
router.post('/join/:meetingNumber', joinClass);
router.get('/student/meetings', getStudentMeetings);

// Common routes
router.get('/:meetingNumber', getMeetingDetails);

module.exports = router;
