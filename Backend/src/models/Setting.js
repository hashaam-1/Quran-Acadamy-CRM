const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  academyName: {
    type: String,
    default: 'Quran Academy',
    required: true
  },
  contactEmail: {
    type: String,
    default: 'info@quranacademy.com',
    required: true
  },
  contactPhone: {
    type: String,
    default: '+1 234 567 8900',
    required: true
  },
  address: {
    type: String,
    default: '123 Islamic Street, City, Country'
  },
  timezone: {
    type: String,
    default: 'UTC',
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  invoicePrefix: {
    type: String,
    default: 'INV-2024-',
    required: true
  },
  autoGenerateInvoices: {
    type: Boolean,
    default: true
  },
  sendInvoiceWhatsApp: {
    type: Boolean,
    default: true
  },
  whatsappPhoneId: {
    type: String,
    default: ''
  },
  whatsappBusinessId: {
    type: String,
    default: ''
  },
  whatsappAccessToken: {
    type: String,
    default: ''
  },
  passwordMinLength: {
    type: Number,
    default: 8
  },
  requireUppercase: {
    type: Boolean,
    default: true
  },
  requireNumber: {
    type: Boolean,
    default: true
  },
  requireSpecialChar: {
    type: Boolean,
    default: false
  },
  encryptPhoneNumbers: {
    type: Boolean,
    default: true
  },
  disableDataExport: {
    type: Boolean,
    default: true
  },
  sessionTimeout: {
    type: String,
    default: '30'
  },
  dailyClassReminder: {
    type: Boolean,
    default: true
  },
  teacherAbsenceAlert: {
    type: Boolean,
    default: true
  },
  feeDueReminder: {
    type: Boolean,
    default: true
  },
  overduePaymentAlert: {
    type: Boolean,
    default: true
  },
  trialFollowup: {
    type: Boolean,
    default: true
  },
  inactiveStudentReactivation: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create a singleton - there should only be one settings document
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
