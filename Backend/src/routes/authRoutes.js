const express = require('express');
const { unifiedLogin, verifyToken } = require('../controllers/authController.js');

console.log('🔥 AUTH ROUTES LOADED - unifiedLogin function:', typeof unifiedLogin);
console.log('🔥 AUTH ROUTES LOADED - verifyToken function:', typeof verifyToken);

const router = express.Router();

// Import rate limiter from server (will be passed as middleware)
const rateLimit = require('express-rate-limit');

// Rate limiting for login endpoints (prevent brute force attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ UNIFIED LOGIN ENDPOINT - Single endpoint for all roles with rate limiting
router.post('/unified-login', loginLimiter, unifiedLogin);

// ✅ VERIFY TOKEN ENDPOINT - Fix infinite loading issue
router.get('/verify-token', verifyToken);

console.log('🔥 AUTH ROUTE DEFINED: POST /unified-login');
console.log('🔥 AUTH ROUTE DEFINED: GET /verify-token');

module.exports = router;
