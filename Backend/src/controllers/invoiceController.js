const Invoice = require('../models/Invoice.js');

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('studentId', 'name age')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single invoice
module.exports. getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('studentId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create invoice
module.exports. createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    const newInvoice = await invoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update invoice
module.exports. updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete invoice
module.exports. deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoices by student
module.exports. getInvoicesByStudent = async (req, res) => {
  try {
    const invoices = await Invoice.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice statistics
module.exports. getInvoiceStats = async (req, res) => {
  try {
    const total = await Invoice.countDocuments();
    const paid = await Invoice.countDocuments({ status: 'paid' });
    const unpaid = await Invoice.countDocuments({ status: 'unpaid' });
    const overdue = await Invoice.countDocuments({ status: 'overdue' });
    const partial = await Invoice.countDocuments({ status: 'partial' });
    
    const revenue = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' },
          totalPending: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const monthlyRevenue = await Invoice.aggregate([
      {
        $group: {
          _id: '$month',
          revenue: { $sum: '$paidAmount' },
          pending: { $sum: { $subtract: ['$amount', '$paidAmount'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      total,
      paid,
      unpaid,
      overdue,
      partial,
      totalRevenue: revenue[0]?.totalRevenue || 0,
      totalPending: revenue[0]?.totalPending || 0,
      totalAmount: revenue[0]?.totalAmount || 0,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark invoice as paid
module.exports. markAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    invoice.status = 'paid';
    invoice.paidAmount = invoice.amount;
    await invoice.save();
    
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
