const express = require('express');
const upload = require('../middleware/upload');
const {
  getSyllabi,
  getSyllabusById,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  getSyllabusStats
} = require('../controllers/syllabusController');

const router = express.Router();

// Get all syllabi
router.get('/', getSyllabi);

// Get syllabus statistics
router.get('/stats', getSyllabusStats);

// Get single syllabus by ID
router.get('/:id', getSyllabusById);

// Create new syllabus (admin, team_leader, teacher only)
// Supports multiple file uploads
router.post('/', upload.array('attachments', 5), createSyllabus);

// Update syllabus (admin, team_leader, teacher only)
// Supports multiple file uploads
router.put('/:id', upload.array('attachments', 5), updateSyllabus);

// Delete syllabus (admin, team_leader only)
router.delete('/:id', deleteSyllabus);

module.exports = router;
