const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings
} = require('../controllers/settingController');

// GET /api/settings - Get all settings
router.get('/', getSettings);

// PUT /api/settings - Update settings
router.put('/', updateSettings);

// POST /api/settings/reset - Reset to defaults
router.post('/reset', resetSettings);

module.exports = router;
