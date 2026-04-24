const express = require('express');
const { unifiedLogin } = require('../controllers/authController.js');

console.log('🔥 AUTH ROUTES LOADED - unifiedLogin function:', typeof unifiedLogin);

const router = express.Router();

// ✅ UNIFIED LOGIN ENDPOINT - Single endpoint for all roles
router.post('/unified-login', unifiedLogin);

console.log('🔥 AUTH ROUTE DEFINED: POST /unified-login');

module.exports = router;
