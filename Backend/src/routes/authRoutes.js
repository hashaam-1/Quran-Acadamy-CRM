const express = require('express');
const { unifiedLogin } = require('../controllers/authController.js');

const router = express.Router();

// ✅ UNIFIED LOGIN ENDPOINT - Single endpoint for all roles
router.post('/unified-login', unifiedLogin);

module.exports = router;
