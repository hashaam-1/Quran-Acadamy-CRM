const express = require('express');
const { unifiedLogin, verifyToken } = require('../controllers/authController.js');

console.log('🔥 AUTH ROUTES LOADED - unifiedLogin function:', typeof unifiedLogin);
console.log('🔥 AUTH ROUTES LOADED - verifyToken function:', typeof verifyToken);

const router = express.Router();

// ✅ UNIFIED LOGIN ENDPOINT - Single endpoint for all roles
router.post('/unified-login', unifiedLogin);

// ✅ VERIFY TOKEN ENDPOINT - Fix infinite loading issue
router.get('/verify-token', verifyToken);

console.log('🔥 AUTH ROUTE DEFINED: POST /unified-login');
console.log('🔥 AUTH ROUTE DEFINED: GET /verify-token');

module.exports = router;
