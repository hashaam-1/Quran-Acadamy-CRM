const Attendance = require('../models/Attendance');

// Teacher checkout endpoint
exports.teacherCheckout = async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find today's attendance record for the teacher
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      teacherId,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today. Please check in first.' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ 
        message: 'Already checked out today',
        checkOutTime: attendance.checkOutTime 
      });
    }

    // Set checkout time
    const now = new Date();
    attendance.checkOutTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });
    
    await attendance.save();

    res.json({
      message: 'Checked out successfully',
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      attendance: {
        ...attendance.toObject(),
        id: attendance._id.toString()
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's today attendance status
exports.getTeacherTodayAttendance = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      teacherId,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    });

    if (!attendance) {
      return res.json({ 
        checkedIn: false,
        checkedOut: false,
        message: 'Not checked in yet'
      });
    }

    res.json({
      checkedIn: !!attendance.checkInTime,
      checkedOut: !!attendance.checkOutTime,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      status: attendance.status,
      attendance: {
        ...attendance.toObject(),
        id: attendance._id.toString()
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  teacherCheckout: exports.teacherCheckout,
  getTeacherTodayAttendance: exports.getTeacherTodayAttendance
};
