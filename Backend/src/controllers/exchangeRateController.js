const ExchangeRate = require('../models/ExchangeRate');
const axios = require('axios');

// Get latest exchange rates
exports.getLatestRates = async (req, res) => {
  try {
    const latestRate = await ExchangeRate.findOne().sort({ updatedAt: -1 });
    
    if (!latestRate) {
      return res.status(404).json({ message: 'No exchange rates found' });
    }
    
    res.json(latestRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch and update exchange rates from API
exports.updateRates = async (req, res) => {
  try {
    // Using exchangerate-api.com (free tier)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/PKR');
    
    const rates = response.data.rates;
    
    // Filter for supported currencies
    const supportedCurrencies = ['USD', 'GBP', 'CAD', 'AUD', 'PKR', 'AED', 'EUR'];
    const filteredRates = {};
    
    supportedCurrencies.forEach(currency => {
      if (rates[currency]) {
        filteredRates[currency] = rates[currency];
      }
    });
    
    // Create or update exchange rate document
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      {},
      {
        base: 'PKR',
        rates: filteredRates,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json(exchangeRate);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates' });
  }
};

// Convert amount from PKR to target currency
exports.convertCurrency = async (req, res) => {
  try {
    const { amountPKR, targetCurrency } = req.body;
    
    if (!amountPKR || !targetCurrency) {
      return res.status(400).json({ message: 'amountPKR and targetCurrency are required' });
    }
    
    const latestRate = await ExchangeRate.findOne().sort({ updatedAt: -1 });
    
    if (!latestRate) {
      return res.status(404).json({ message: 'No exchange rates found' });
    }
    
    const rate = latestRate.rates.get(targetCurrency);
    
    if (!rate) {
      return res.status(400).json({ message: 'Unsupported currency' });
    }
    
    const convertedAmount = amountPKR * rate;
    
    res.json({
      amountPKR,
      targetCurrency,
      exchangeRate: rate,
      convertedAmount,
      convertedAmountRounded: Math.round(convertedAmount * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
