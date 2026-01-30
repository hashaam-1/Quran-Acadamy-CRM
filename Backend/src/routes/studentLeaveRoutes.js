const express = require('express');
const {
  getStudentLeaves,
  createStudentLeave,
  getStudentLeaveStats,
  deleteStudentLeave
} = require('../controllers/studentLeaveController.js');

const router = express.Router();

router.get('/', getStudentLeaves);
router.get('/stats', getStudentLeaveStats);
router.post('/', createStudentLeave);
router.delete('/:id', deleteStudentLeave);

module.exports = router;
