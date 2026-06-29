const express = require('express');
const {
  getLatestRates,
  updateRates,
  convertCurrency
} = require('../controllers/exchangeRateController');

const router = express.Router();

// Get latest exchange rates
router.get('/', getLatestRates);

// Update exchange rates from API (admin only)
router.post('/update', updateRates);

// Convert currency
router.post('/convert', convertCurrency);

module.exports = router;
