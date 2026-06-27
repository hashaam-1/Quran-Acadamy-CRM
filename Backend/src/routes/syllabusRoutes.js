const express = require('express');
const { upload } = require('../middleware/upload');
const { r2Client } = require('../config/r2');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const {
  getSyllabi,
  getSyllabusById,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  getSyllabusStats
} = require('../controllers/syllabusController');

const router = express.Router();

console.log('🔍 SYLLABUS ROUTES: Loading syllabus routes...');
console.log('🔍 SYLLABUS ROUTES: Upload middleware loaded:', typeof upload);
console.log('🔍 SYLLABUS ROUTES: Controller functions loaded:', {
  getSyllabi: typeof getSyllabi,
  getSyllabusById: typeof getSyllabusById,
  createSyllabus: typeof createSyllabus,
  updateSyllabus: typeof updateSyllabus,
  deleteSyllabus: typeof deleteSyllabus,
  getSyllabusStats: typeof getSyllabusStats
});
const fs = require('fs');
const path = require('path');

// Get all syllabi
router.get('/', getSyllabi);

// Get syllabus statistics
router.get('/stats', getSyllabusStats);

// Serve file from R2 with proper headers for inline viewing
// MUST be before /:id route to avoid route conflicts
router.get('/file/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    const bucketName = process.env.R2_BUCKET_NAME;
    
    console.log('📄 Serving file from R2:', { key, bucketName });
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await r2Client.send(command);
    
    // Set appropriate headers for inline viewing
    const contentType = response.ContentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${key.split('/').pop()}"`);
    
    // Cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the file to the client
    response.Body.pipe(res);
  } catch (error) {
    console.error('❌ Error serving file from R2:', error);
    res.status(500).json({ message: 'Failed to serve file', error: error.message });
  }
});

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
