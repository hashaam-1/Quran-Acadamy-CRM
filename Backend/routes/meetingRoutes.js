const express = require('express');
const router = express.Router();
const {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails
} = require('../controllers/meetingController');

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
