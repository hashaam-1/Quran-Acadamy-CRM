const express = require('express');

console.log('� SCHEDULE ROUTES LOADED - This should appear in logs');

const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDay,
  getSchedulesByTeacher,
  getSchedulesByStudent,
  requestReschedule,
  handleReschedule,
  getScheduleStats,
  cleanupFakeMeetings
} = require('../controllers/scheduleController.js');

console.log('🔍 DEBUG: scheduleController functions imported:', {
  getSchedules: typeof getSchedules,
  getScheduleById: typeof getScheduleById,
  createSchedule: typeof createSchedule
});

const router = express.Router();

router.get('/', getSchedules);
router.get('/stats', getScheduleStats);
router.get('/day/:day', getSchedulesByDay);
router.get('/teacher/:teacherId', getSchedulesByTeacher);
router.get('/student/:studentId', getSchedulesByStudent);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.post('/:id/reschedule', requestReschedule);
router.put('/:id/reschedule/handle', handleReschedule);
router.post('/cleanup-fake-meetings', cleanupFakeMeetings);

module.exports = router;
