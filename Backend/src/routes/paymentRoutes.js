const express = require('express');
const { createPaymentSession, processPayment } = require('../controllers/paymentController');
const router = express.Router();

router.post('/create-session', createPaymentSession);
router.post('/process', processPayment);

module.exports = router;
