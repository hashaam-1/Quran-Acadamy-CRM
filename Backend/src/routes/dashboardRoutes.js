const express = require('express');
const {
  getDashboardStats,
  getTeacherPerformanceData,
  getInvoiceReportData,
  getStudentLeaveAnalytics,
  getLeadsPipelineData,
  getStudentProgressData,
  getSalesConversionData
} = require('../controllers/dashboardController.js');

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/teacher-performance', getTeacherPerformanceData);
router.get('/invoice-report', getInvoiceReportData);
router.get('/student-leave-analytics', getStudentLeaveAnalytics);
router.get('/leads-pipeline', getLeadsPipelineData);
router.get('/student-progress/:studentId', getStudentProgressData);
router.get('/sales-conversion', getSalesConversionData);

module.exports = router;
