const express = require('express');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addCallLog,
  getLeadsStats
} = require('../controllers/leadController.js');

const router = express.Router();

router.get('/', getLeads);
router.get('/stats', getLeadsStats);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/call-logs', addCallLog);

module.exports = router;
