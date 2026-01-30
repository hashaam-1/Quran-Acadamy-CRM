const express = require('express');
const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDay,
  getSchedulesByTeacher,
  requestReschedule,
  handleReschedule,
  getScheduleStats
} = require('../controllers/scheduleController.js');

const router = express.Router();

router.get('/', getSchedules);
router.get('/stats', getScheduleStats);
router.get('/day/:day', getSchedulesByDay);
router.get('/teacher/:teacherId', getSchedulesByTeacher);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.post('/:id/reschedule', requestReschedule);
router.put('/:id/reschedule/handle', handleReschedule);

module.exports = router;
