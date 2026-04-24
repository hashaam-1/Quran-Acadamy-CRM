const express = require('express');
const router = express.Router();

console.log('🔍 DEBUG: testSchedules.js loading...');

// Minimal test route
router.get('/', (req, res) => {
  console.log('🔍 DEBUG: Test schedules endpoint called');
  res.json({
    success: true,
    message: 'Schedules endpoint working!',
    data: [],
    count: 0
  });
});

module.exports = router;
