const axios = require('axios');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const ExchangeRate = require('../models/ExchangeRate');

const MPGS_CONFIG = {
  merchantId: process.env.MPGS_MERCHANT_ID,
  merchantUsername: process.env.MPGS_MERCHANT_USERNAME,
  apiPassword: process.env.MPGS_API_PASSWORD,
  gatewayUrl: process.env.MPGS_GATEWAY_URL
};

// MPGS supported currencies (test environment - Pakistan MCB gateway supports PKR)
const MPGS_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'CNY', 'INR', 'AED', 'SAR', 'PKR'];

exports.createPaymentSession = async (req, res) => {
  try {
    const { invoiceId, amount, currency } = req.body;

    // Validate invoiceId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      console.error('Invalid invoice ID:', invoiceId);
      return res.status(400).json({ success: false, message: 'Invalid invoice ID', invoiceId });
    }

    const invoice = await Invoice.findById(invoiceId).populate('studentId');
    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const student = await Student.findById(invoice.studentId);
    let paymentCurrency = currency || invoice.currency || student?.currency || 'PKR';
    let paymentAmount = Number(amount || invoice.amount);
    const orderId = `ORD-${Math.floor(Date.now() / 1000)}`;

    // Convert unsupported currencies to USD
    if (!MPGS_SUPPORTED_CURRENCIES.includes(paymentCurrency)) {
      console.log(`🔥 Currency ${paymentCurrency} not supported by MPGS, converting to USD`);

      try {
        const exchangeRate = await ExchangeRate.findOne({ from: paymentCurrency, to: 'USD' });
        if (exchangeRate && exchangeRate.rate) {
          paymentAmount = paymentAmount * exchangeRate.rate;
          paymentCurrency = 'USD';
          console.log(`🔥 Converted ${paymentCurrency} to USD: ${paymentAmount}`);
        } else {
          console.log(`🔥 No exchange rate found for ${paymentCurrency}, using USD with default rate`);
          paymentCurrency = 'USD';
        }
      } catch (error) {
        console.error('🔥 Error fetching exchange rate:', error);
        paymentCurrency = 'USD';
      }
    }

    // For Pakistan MCB test gateway, try PKR first if original was PKR
    const originalCurrency = currency || invoice.currency || student?.currency || 'PKR';
    if (originalCurrency === 'PKR' && MPGS_SUPPORTED_CURRENCIES.includes('PKR')) {
      paymentCurrency = 'PKR';
      paymentAmount = Number(amount || invoice.amount);
      console.log(`🔥 Using PKR for Pakistan gateway`);
    }

    const sessionRequest = {
      apiOperation: 'CREATE_CHECKOUT_SESSION',
      order: {
        id: orderId,
        amount: Number(paymentAmount).toFixed(2),
        currency: paymentCurrency,
        description: `Invoice Payment - ${invoice.studentName} - ${invoice.month}`
      },
      interaction: {
        operation: 'PURCHASE',
        merchant: {
          name: 'Quran Academy'
        },
        returnUrl: `${process.env.FRONTEND_URL}/payment-success`
      }
    };

    console.log('🔥 MPGS Session Request:', JSON.stringify(sessionRequest, null, 2));
    console.log('🔥 Currency:', paymentCurrency);
    console.log('🔥 Amount:', paymentAmount);

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');

    const response = await axios.post(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/session`,
      sessionRequest,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    console.log('🔥 MPGS Response Status:', response.status);
    console.log('🔥 MPGS Response Data:', JSON.stringify(response.data, null, 2));

    // Check if response is HTML (error page)
    if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
      console.error('MPGS returned HTML error page instead of JSON');
      return res.status(500).json({ message: 'MPGS API returned error page. Check credentials and endpoint.' });
    }

    // Check for MPGS errors in response
    if (response.data.error) {
      console.error('🔥 MPGS Error:', response.data.error);
      return res.status(400).json({
        success: false,
        message: 'MPGS API error',
        error: response.data.error,
        explanation: response.data.explanation
      });
    }

    res.json({
      success: true,
      sessionId: response.data.session.id,
      successIndicator: response.data.session?.successIndicator || response.data.successIndicator,
      orderId,
      invoiceId,
      amount: paymentAmount,
      currency: paymentCurrency
    });
  } catch (error) {
    console.error('Payment session creation error:', error.message);
    if (error.response) {
      console.error('MPGS API error:', error.response.status, error.response.data);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create payment session",
      error: error.message,
      mpgsResponse: error.response?.data
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    console.log("VERIFY PAYMENT:", req.body);
    const { resultIndicator, orderId, invoiceId, successIndicator } = req.body;
    
    if (resultIndicator !== successIndicator) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
    
    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    const response = await axios.get(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/order/${orderId}`,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    
    console.log("ORDER STATUS:", response.data);
    
    if (response.data.result === 'SUCCESS' && response.data.status === 'CAPTURED') {
      await Invoice.findByIdAndUpdate(invoiceId, { status: 'paid', paymentDate: new Date() });
      res.json({ success: true, message: 'Payment successful' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed', status: response.data.status });
    }
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};
