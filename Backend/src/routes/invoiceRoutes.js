const express = require('express');
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByStudent,
  getInvoiceStats,
  markAsPaid
} = require('../controllers/invoiceController.js');

const router = express.Router();

router.get('/', getInvoices);
router.get('/stats', getInvoiceStats);
router.get('/student/:studentId', getInvoicesByStudent);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.put('/:id/mark-paid', markAsPaid);
router.delete('/:id', deleteInvoice);

module.exports = router;
