const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amountPKR: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'GBP', 'CAD', 'AUD', 'PKR', 'AED', 'EUR', 'SAR'],
    default: 'PKR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  month: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'unpaid', 'overdue', 'partial'],
    default: 'unpaid'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedAmount: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ studentId: 1 });
invoiceSchema.index({ dueDate: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
