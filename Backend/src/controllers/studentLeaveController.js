const StudentLeave = require('../models/StudentLeave.js');

// Get all student leaves
exports.getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.find()
      .populate('studentId', 'name age course')
      .sort({ date: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create student leave record
module.exports. createStudentLeave = async (req, res) => {
  try {
    const leave = new StudentLeave(req.body);
    const newLeave = await leave.save();
    res.status(201).json(newLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get student leave statistics
module.exports. getStudentLeaveStats = async (req, res) => {
  try {
    const total = await StudentLeave.countDocuments();
    
    const byReason = await StudentLeave.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const byMonth = await StudentLeave.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      total,
      byReason,
      byMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete student leave record
module.exports. deleteStudentLeave = async (req, res) => {
  try {
    const leave = await StudentLeave.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave record not found' });
    }
    res.json({ message: 'Leave record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
