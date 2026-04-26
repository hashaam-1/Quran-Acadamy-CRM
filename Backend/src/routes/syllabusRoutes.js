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
const fs = require('fs');
const path = require('path');

// Get all syllabi
router.get('/', getSyllabi);

// Get syllabus statistics
router.get('/stats', getSyllabusStats);

// Get single syllabus by ID
router.get('/:id', getSyllabusById);

// Debug endpoint to check if file exists
router.get('/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/syllabi', filename);
  
  console.log('🔍 Debug: Checking file existence:', filePath);
  console.log('🔍 Debug: File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      success: true,
      message: 'File exists',
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } else {
    res.json({
      success: false,
      message: 'File not found',
      path: filePath,
      uploadsDir: path.join(__dirname, '../../uploads/syllabi'),
      uploadsDirExists: fs.existsSync(path.join(__dirname, '../../uploads/syllabi'))
    });
  }
});

// Create new syllabus (admin, team_leader, teacher only)
// Supports multiple file uploads
router.post('/', upload.array('attachments', 5), createSyllabus);

// Update syllabus (admin, team_leader, teacher only)
// Supports multiple file uploads
router.put('/:id', upload.array('attachments', 5), updateSyllabus);

// Delete syllabus (admin, team_leader only)
router.delete('/:id', deleteSyllabus);

module.exports = router;
