const express = require('express');
const {
  getProgressRecords,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress,
  getProgressByStudent,
  getLatestProgress,
  getProgressStats
} = require('../controllers/progressController.js');

const router = express.Router();

router.get('/', getProgressRecords);
router.get('/stats', getProgressStats);
router.get('/latest', getLatestProgress);
router.get('/student/:studentId', getProgressByStudent);
router.get('/:id', getProgressById);
router.post('/', createProgress);
router.put('/:id', updateProgress);
router.delete('/:id', deleteProgress);

module.exports = router;
