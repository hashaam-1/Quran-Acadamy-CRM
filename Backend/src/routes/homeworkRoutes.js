const express = require('express');
const {
  getAllHomework,
  getHomeworkById,
  getHomeworkByStudent,
  getHomeworkByTeacher,
  createHomework,
  updateHomework,
  submitHomework,
  gradeHomework,
  deleteHomework,
  getHomeworkStats
} = require('../controllers/homeworkController.js');

const router = express.Router();

router.get('/', getAllHomework);
router.get('/stats', getHomeworkStats);
router.get('/student/:studentId', getHomeworkByStudent);
router.get('/teacher/:teacherId', getHomeworkByTeacher);
router.get('/:id', getHomeworkById);
router.post('/', createHomework);
router.put('/:id', updateHomework);
router.put('/:id/submit', submitHomework);
router.put('/:id/grade', gradeHomework);
router.delete('/:id', deleteHomework);

module.exports = router;
