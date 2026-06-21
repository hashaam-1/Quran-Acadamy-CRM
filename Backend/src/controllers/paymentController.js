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
    const { invoiceId, amount, currency } = req.body;
    const invoice = await Invoice.findById(invoiceId).populate('studentId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const student = await Student.findById(invoice.studentId);
    const paymentCurrency = currency || student.currency || 'USD';
    const paymentAmount = amount || invoice.amount;
    const orderId = `ORDER-${invoiceId}-${Date.now()}`;

    const sessionRequest = {
      apiOperation: 'CREATE_CHECKOUT_SESSION',
      interaction: { operation: 'AUTHORIZE', merchant: { name: 'Quran Academy' } },
      order: { amount: paymentAmount.toFixed(2), currency: paymentCurrency, description: `Invoice ${invoice.invoiceNo}`, id: orderId }
    };

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    const response = await axios.post(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/session`,
      sessionRequest,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, sessionId: response.data.session.id, orderId, amount: paymentAmount, currency: paymentCurrency });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment session', error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { sessionId, orderId, cardNumber, cardExpiry, cardCvc, cardHolderName } = req.body;
    const paymentRequest = {
      apiOperation: 'PAY',
      session: { id: sessionId },
      order: { id: orderId },
      sourceOfFunds: {
        type: 'CARD',
        provided: {
          card: {
            number: cardNumber,
            expiry: { year: cardExpiry.slice(-2), month: cardExpiry.slice(0, 2) },
            securityCode: cardCvc
          },
          cardHolder: { name: cardHolderName }
        }
      }
    };

    const auth = Buffer.from(`${MPGS_CONFIG.merchantUsername}:${MPGS_CONFIG.apiPassword}`).toString('base64');
    const response = await axios.post(
      `${MPGS_CONFIG.gatewayUrl}api/rest/version/59/merchant/${MPGS_CONFIG.merchantId}/order/${orderId}/transaction`,
      paymentRequest,
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    if (response.data.result === 'SUCCESS') {
      await Invoice.findOneAndUpdate({ invoiceNo: orderId.replace('ORDER-', '').split('-')[0] }, { status: 'paid', paymentDate: new Date() });
      res.json({ success: true, message: 'Payment successful' });
    } else {
      res.status(400).json({ success: false, message: 'Payment failed', error: response.data });
    }
  } catch (error) {
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
};
