const express = require('express');
const {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  markAttendance,
  markTeacherAttendance,
  cleanupTeacherAttendance,
  getStudentsForAttendance,
  getAttendanceByStudent,
} = require('../controllers/attendanceController.js');
const {
  getTodayScheduledClasses,
  markScheduledAttendance,
  getScheduleAttendanceSummary
} = require('../controllers/scheduleAttendanceController.js');

const router = express.Router();

router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/students', getStudentsForAttendance);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/scheduled/:teacherId', getTodayScheduledClasses);
router.get('/schedule-summary/:teacherId', getScheduleAttendanceSummary);
router.get('/:id', getAttendanceById);
router.post('/', createAttendance);
router.post('/mark', markAttendance);
router.post('/mark-teacher', markTeacherAttendance);
router.post('/mark-scheduled', markScheduledAttendance);
router.post('/cleanup-teacher', cleanupTeacherAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
