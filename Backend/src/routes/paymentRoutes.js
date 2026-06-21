const express = require('express');
const { createPaymentSession, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

router.post('/create-session', createPaymentSession);
router.post('/verify', verifyPayment);

module.exports = router;
