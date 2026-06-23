console.log("🔥 PAYMENT CONTROLLER FILE LOADED - VERSION 2");

const axios = require('axios');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');

const MPGS_CONFIG = {
  merchantId: process.env.MPGS_MERCHANT_ID,
  merchantUsername: process.env.MPGS_MERCHANT_USERNAME,
  apiPassword: process.env.MPGS_API_PASSWORD,
  gatewayUrl: process.env.MPGS_GATEWAY_URL
};

exports.createPaymentSession = async (req, res) => {
  console.log("🔥🔥🔥 PAYMENT CONTROLLER HIT");
  console.log("🔥🔥🔥 BODY:", JSON.stringify(req.body, null, 2));
  console.log("🔥🔥🔥 ENV CHECK", {
    merchantId: process.env.MPGS_MERCHANT_ID,
    merchantUsername: process.env.MPGS_MERCHANT_USERNAME,
    passwordExists: !!process.env.MPGS_API_PASSWORD,
    frontend: process.env.FRONTEND_URL,
    gatewayUrl: process.env.MPGS_GATEWAY_URL
  });

  try {
    console.log('🔥�� Payment session request received:', req.body);
    const { invoiceId, amount, currency } = req.body;

    // Validate invoiceId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      console.log('❌ Invalid invoice ID:', invoiceId);
      return res.status(400).json({ success: false, message: 'Invalid invoice ID', invoiceId });
    }
    
    console.log('🔍 Finding invoice:', invoiceId);
    const invoice = await Invoice.findById(invoiceId).populate('studentId');
    if (!invoice) {
      console.log('❌ Invoice not found');
      return res.status(404).json({ message: 'Invoice not found' });
    }

    console.log('🔍 Invoice found:', invoice);
    const student = await Student.findById(invoice.studentId);
    const paymentCurrency = currency || student?.currency || 'USD';
    const paymentAmount = Number(amount || invoice.amount);
    // MPGS-compliant order ID (only alphanumeric, dash, underscore)
    const orderId = `ORD-${Math.floor(Date.now() / 1000)}`;

    console.log('🔍 Creating MPGS session:', { orderId, amount: paymentAmount, currency: paymentCurrency });
    const sessionRequest = {
      apiOperation: 'INITIATE_CHECKOUT',
      interaction: {
        operation: 'PAY',
        returnUrl: `${process.env.FRONTEND_URL}/payment/success`
      },
      order: { id: orderId }
    };

    console.log('🔍 MPGS REQUEST BODY:', JSON.stringify(sessionRequest, null, 2));

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    console.log('🔍 MPGS Config:', { merchantId: MPGS_CONFIG.merchantId, gatewayUrl: MPGS_CONFIG.gatewayUrl });
    const fullUrl = `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/session`;
    console.log("FULL MPGS URL:", fullUrl);
    console.log("FULL MPGS PAYLOAD:", JSON.stringify(sessionRequest, null, 2));

    const response = await axios.post(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/session`,
      sessionRequest,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    console.log('✅ MPGS Response Status:', response.status);
    console.log('✅ MPGS Response Data:', response.data);
    
    // Check if response is HTML (error page)
    if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
      console.error('❌ MPGS returned HTML error page instead of JSON');
      console.error('❌ HTML Response:', response.data.substring(0, 500));
      return res.status(500).json({ message: 'MPGS API returned error page. Check credentials and endpoint.' });
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
    console.log("🔥 ERROR:", error.message);
    if (error.response) {
      console.log("🔥 MPGS STATUS:", error.response.status);
      console.log("FULL MPGS ERROR:", JSON.stringify(error.response.data, null, 2));
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
