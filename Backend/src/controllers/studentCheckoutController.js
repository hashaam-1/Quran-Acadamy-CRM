const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Student checkout endpoint
exports.studentCheckout = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find today's attendance record for the student
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      studentId,
      userType: 'student',
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
    console.error('Student checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get student's today attendance status
exports.getStudentTodayAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      studentId,
      userType: 'student',
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
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Auto checkout all students who are checked in but not checked out (for end of day)
exports.autoCheckoutStudents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      userType: 'student',
      date: { $gte: today, $lte: endOfDay },
      checkInTime: { $exists: true },
      checkOutTime: { $exists: false }
    });

    const now = new Date();
    const checkoutTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    const updatedAttendances = [];
    for (const attendance of attendances) {
      attendance.checkOutTime = checkoutTime;
      await attendance.save();
      updatedAttendances.push({
        ...attendance.toObject(),
        id: attendance._id.toString()
      });
    }

    res.json({
      message: `Auto-checked out ${updatedAttendances.length} students`,
      checkoutTime,
      students: updatedAttendances
    });
  } catch (error) {
    console.error('Auto checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  studentCheckout: exports.studentCheckout,
  getStudentTodayAttendance: exports.getStudentTodayAttendance,
  autoCheckoutStudents: exports.autoCheckoutStudents
};
