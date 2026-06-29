const mongoose = require('mongoose');
const ExchangeRate = require('../models/ExchangeRate');
const axios = require('axios');
require('dotenv').config();

async function initializeExchangeRates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch exchange rates from API
    console.log('🔄 Fetching exchange rates from API...');
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/PKR');
    
    const rates = response.data.rates;
    
    // Filter for supported currencies
    const supportedCurrencies = ['USD', 'GBP', 'CAD', 'AUD', 'PKR', 'AED', 'EUR'];
    const filteredRates = {};
    
    supportedCurrencies.forEach(currency => {
      if (rates[currency]) {
        filteredRates[currency] = rates[currency];
        console.log(`   ${currency}: ${rates[currency]}`);
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
    
    console.log('✅ Exchange rates initialized successfully');
    console.log('📊 Base currency:', exchangeRate.base);
    console.log('📊 Rates:', Object.fromEntries(exchangeRate.rates));
    console.log('📊 Updated at:', exchangeRate.updatedAt);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initializeExchangeRates();
