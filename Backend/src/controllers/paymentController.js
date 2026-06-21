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
  try {
    console.log('🔍 Payment session request received:', req.body);
    const { invoiceId, amount, currency } = req.body;
    
    console.log('🔍 Finding invoice:', invoiceId);
    const invoice = await Invoice.findById(invoiceId).populate('studentId');
    if (!invoice) {
      console.log('❌ Invoice not found');
      return res.status(404).json({ message: 'Invoice not found' });
    }

    console.log('🔍 Invoice found:', invoice);
    const student = await Student.findById(invoice.studentId);
    const paymentCurrency = currency || student?.currency || 'USD';
    const paymentAmount = amount || invoice.amount;
    // MPGS-compliant order ID (only alphanumeric, dash, underscore)
    const orderId = `ORD-${Math.floor(Date.now() / 1000)}`;

    console.log('🔍 Creating MPGS session:', { orderId, amount: paymentAmount, currency: paymentCurrency });
    const sessionRequest = {
      apiOperation: 'CREATE_CHECKOUT_SESSION',
      interaction: { operation: 'PURCHASE', merchant: { name: 'Quran Academy' } },
      order: { amount: paymentAmount.toFixed(2), currency: paymentCurrency, description: `Invoice ${invoice.invoiceNo}`, id: orderId }
    };

    console.log('🔍 MPGS REQUEST BODY:', JSON.stringify(sessionRequest, null, 2));

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    console.log('🔍 MPGS Config:', { merchantId: MPGS_CONFIG.merchantId, gatewayUrl: MPGS_CONFIG.gatewayUrl });
    console.log('🔍 Request URL:', `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/session`);
    
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
    
    res.json({ success: true, sessionId: response.data.session.id, orderId, invoiceId, amount: paymentAmount, currency: paymentCurrency });
  } catch (error) {
    console.error('❌ Payment session error:', error.message);
    console.error('❌ MPGS ERROR STATUS:', error.response?.status);
    console.error('❌ MPGS ERROR DATA:', error.response?.data);
    console.error('❌ Full error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment session', 
      error: error.message,
      mpgsStatus: error.response?.status,
      mpgsError: error.response?.data
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    console.log("🔥 PROCESS PAYMENT HIT");
    console.log("BODY:", req.body);
    
    const { sessionId, orderId, invoiceId, cardNumber, cardExpiry, cardCvc } = req.body;
    const [month, year] = cardExpiry.split('/');
    console.log("Expiry Month:", month);
    console.log("Expiry Year:", year);
    const transactionId = `TXN-${Date.now()}`;
    const paymentRequest = {
      apiOperation: 'PAY',
      session: { id: sessionId },
      sourceOfFunds: {
        type: 'CARD',
        provided: {
          card: {
            number: cardNumber.replace(/\s/g, ''),
            expiry: { year, month },
            securityCode: cardCvc
          }
        }
      }
    };

    console.log("PAY REQUEST:", JSON.stringify(paymentRequest, null, 2));

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    const response = await axios.put(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/order/${orderId}/transaction/${transactionId}`,
      paymentRequest,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    console.log("MPGS RESPONSE:", JSON.stringify(response.data, null, 2));

    if (response.data.result === 'SUCCESS') {
      await Invoice.findByIdAndUpdate(invoiceId, { status: 'paid', paymentDate: new Date() });
      res.json({ success: true, message: 'Payment successful' });
    } else {
      res.status(400).json({ success: false, message: 'Payment failed', error: response.data });
    }
  } catch (error) {
    console.error("🔥 PROCESS PAYMENT ERROR");
    console.error(error.response?.data);
    console.error(error);
    
    res.status(500).json({ 
      message: 'Payment processing failed', 
      error: error.message,
      mpgsStatus: error.response?.status,
      mpgsError: error.response?.data
    });
  }
};
