const express = require('express');
const { createPaymentSession, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

// Test route to verify payment routes are working
router.get('/test', (req, res) => {
  console.log("🔥 PAYMENT ROUTE TEST HIT");
  res.json({ success: true, message: 'Payment routes working' });
});

router.post('/create-session', createPaymentSession);
router.post('/verify', verifyPayment);

module.exports = router;
