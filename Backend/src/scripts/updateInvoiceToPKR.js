const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
require('dotenv').config();

async function updateInvoiceToPKR() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update the specific invoice to PKR
    const invoice = await Invoice.findByIdAndUpdate(
      '6a421d9b20777291edb05ceb',
      {
        currency: 'PKR',
        amount: 10000,
        amountPKR: 10000,
        exchangeRate: 1
      },
      { new: true }
    );

    if (invoice) {
      console.log('✅ Updated invoice to PKR:');
      console.log('   Invoice ID:', invoice._id);
      console.log('   Student Name:', invoice.studentName);
      console.log('   Amount PKR:', invoice.amountPKR);
      console.log('   Amount:', invoice.amount);
      console.log('   Currency:', invoice.currency);
      console.log('   Exchange Rate:', invoice.exchangeRate);
    } else {
      console.log('❌ Invoice not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateInvoiceToPKR();
