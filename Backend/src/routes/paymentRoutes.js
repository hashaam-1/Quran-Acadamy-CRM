const express = require('express');
const { createPaymentSession, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

// Test route to verify payment routes are working
router.get('/test', (req, res) => {
  console.log("🔥 PAYMENT ROUTE TEST HIT");
  res.json({ success: true, message: 'Payment routes working' });
});

// Debug route to test POST requests
router.post('/debug', (req, res) => {
  console.log("🔥 DEBUG PAYMENT BODY:", req.body);
  res.json({
    success: true,
    body: req.body,
    env: {
      merchantId: process.env.MPGS_MERCHANT_ID,
      merchantUsername: process.env.MPGS_MERCHANT_USERNAME,
      passwordExists: !!process.env.MPGS_API_PASSWORD,
      gatewayUrl: process.env.MPGS_GATEWAY_URL,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Create session route with logging
router.post('/create-session', (req, res, next) => {
  console.log("🔥 PAYMENT ROUTE /create-session HIT");
  console.log("🔥 REQUEST BODY:", JSON.stringify(req.body, null, 2));
  console.log("🔥 REQUEST HEADERS:", JSON.stringify(req.headers, null, 2));
  next();
}, createPaymentSession);

router.post('/verify', verifyPayment);

module.exports = router;
