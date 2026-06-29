const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  base: {
    type: String,
    required: true,
    default: 'PKR'
  },
  rates: {
    type: Map,
    of: Number,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
exchangeRateSchema.index({ updatedAt: -1 });

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

module.exports = ExchangeRate;
