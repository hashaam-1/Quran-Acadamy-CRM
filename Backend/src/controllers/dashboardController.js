const Lead = require('../models/Lead.js');
const Student = require('../models/Student.js');
const Teacher = require('../models/Teacher.js');
const Schedule = require('../models/Schedule.js');
const Invoice = require('../models/Invoice.js');
const Progress = require('../models/Progress.js');
const StudentLeave = require('../models/StudentLeave.js');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Lead stats
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const trialLeads = await Lead.countDocuments({ status: 'trial' });
    const enrolledLeads = await Lead.countDocuments({ status: 'enrolled' });
    
    // Student stats
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const inactiveStudents = await Student.countDocuments({ status: 'inactive' });
    const onHoldStudents = await Student.countDocuments({ status: 'on_hold' });
    
    // Teacher stats
    const totalTeachers = await Teacher.countDocuments();
    const availableTeachers = await Teacher.countDocuments({ status: 'available' });
    const inClassTeachers = await Teacher.countDocuments({ status: 'in_class' });
    
    // Schedule stats
    const totalClasses = await Schedule.countDocuments();
    const completedClasses = await Schedule.countDocuments({ status: 'completed' });
    const scheduledClasses = await Schedule.countDocuments({ status: 'scheduled' });
    
    // Invoice stats
    const invoiceStats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' },
          pendingFees: { $sum: { $subtract: ['$amount', '$paidAmount'] } }
        }
      }
    ]);
    
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const unpaidInvoices = await Invoice.countDocuments({ status: { $ne: 'paid' } });
    
    res.json({
      leads: {
        total: totalLeads,
        new: newLeads,
        trial: trialLeads,
        enrolled: enrolledLeads
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        onHold: onHoldStudents
      },
      teachers: {
        total: totalTeachers,
        available: availableTeachers,
        inClass: inClassTeachers
      },
      classes: {
        total: totalClasses,
        completed: completedClasses,
        scheduled: scheduledClasses
      },
      revenue: {
        total: invoiceStats[0]?.totalRevenue || 0,
        pending: invoiceStats[0]?.pendingFees || 0,
        paidInvoices,
        unpaidInvoices
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher performance data for charts
module.exports. getTeacherPerformanceData = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('name performance punctuality completionRate rating students')
      .sort({ performance: -1 });
    
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice report data for charts
module.exports. getInvoiceReportData = async (req, res) => {
  try {
    const monthlyData = await Invoice.aggregate([
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$amount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: { $subtract: ['$amount', '$paidAmount'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student leave analytics
module.exports. getStudentLeaveAnalytics = async (req, res) => {
  try {
    const leavesByReason = await StudentLeave.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json(leavesByReason);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leads pipeline data
module.exports. getLeadsPipelineData = async (req, res) => {
  try {
    const pipelineData = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(pipelineData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student progress chart data
module.exports. getStudentProgressData = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const progressData = await Progress.find({ studentId })
      .sort({ date: 1 })
      .select('date completion lesson');
    
    res.json(progressData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sales conversion data
module.exports. getSalesConversionData = async (req, res) => {
  try {
    const conversionData = await Lead.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          total: 1,
          converted: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$converted', '$total'] },
              100
            ]
          }
        }
      }
    ]);
    
    res.json(conversionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
