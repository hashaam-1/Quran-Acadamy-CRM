const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Get today's scheduled classes for a teacher
exports.getTodayScheduledClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Get current day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    // Find all schedules for this teacher on this day
    const schedules = await Schedule.find({
      teacherId,
      day: today,
      status: { $in: ['scheduled', 'in_progress'] }
    })
    .populate('studentId', 'name email course status')
    .populate('teacherId', 'name email')
    .sort({ time: 1 });

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check attendance status for each scheduled class
    const schedulesWithAttendance = await Promise.all(
      schedules.map(async (schedule) => {
        const attendance = await Attendance.findOne({
          studentId: schedule.studentId._id,
          scheduleId: schedule._id,
          date: { $gte: todayStart, $lte: todayEnd }
        });

        return {
          _id: schedule._id,
          id: schedule._id.toString(),
          studentId: schedule.studentId._id,
          studentName: schedule.studentName,
          course: schedule.course,
          time: schedule.time,
          scheduledTime: schedule.time,
          duration: schedule.duration,
          status: schedule.status,
          attendanceMarked: !!attendance,
          attendanceStatus: attendance ? attendance.status : 'not_marked',
          checkInTime: attendance ? attendance.checkInTime : null,
          student: schedule.studentId
        };
      })
    );

    res.json(schedulesWithAttendance);
  } catch (error) {
    console.error('Get scheduled classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance for a scheduled class
exports.markScheduledAttendance = async (req, res) => {
  try {
    const { scheduleId, studentId, status } = req.body;

    if (!scheduleId || !studentId || !status) {
      return res.status(400).json({ 
        message: 'Schedule ID, Student ID, and status are required' 
      });
    }

    // Get schedule details
    const schedule = await Schedule.findById(scheduleId)
      .populate('studentId')
      .populate('teacherId');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if it's the correct day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    if (schedule.day !== today) {
      return res.status(400).json({ 
        message: `This class is scheduled for ${schedule.day}, not today (${today})` 
      });
    }

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      studentId,
      scheduleId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const now = new Date();
    const actualTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    if (attendance) {
      // Update existing attendance
      attendance.status = status;
      if (status === 'present' || status === 'late') {
        attendance.checkInTime = actualTime;
      }
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        userType: 'student',
        studentId: schedule.studentId._id,
        studentName: schedule.studentName,
        teacherId: schedule.teacherId._id,
        teacherName: schedule.teacherName,
        course: schedule.course,
        scheduleId: schedule._id,
        scheduledTime: schedule.time,
        scheduledDay: schedule.day,
        duration: schedule.duration,
        classTime: schedule.time,
        date: now,
        status,
        checkInTime: (status === 'present' || status === 'late') ? actualTime : null
      });
      await attendance.save();
    }

    // Update schedule status if needed
    if (schedule.status === 'scheduled') {
      schedule.status = 'in_progress';
      await schedule.save();
    }

    res.json({
      message: 'Attendance marked successfully',
      attendance: {
        ...attendance.toObject(),
        id: attendance._id.toString()
      },
      schedule: {
        ...schedule.toObject(),
        id: schedule._id.toString()
      }
    });
  } catch (error) {
    console.error('Mark scheduled attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance summary for teacher's scheduled classes
exports.getScheduleAttendanceSummary = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date } = req.query;

    // Get date range
    let startDate, endDate;
    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Get current day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days[startDate.getDay()];

    // Get all scheduled classes for this teacher on this day
    const scheduledClasses = await Schedule.find({
      teacherId,
      day: targetDay,
      status: { $in: ['scheduled', 'in_progress', 'completed'] }
    });

    // Get attendance records for these classes
    const attendanceRecords = await Attendance.find({
      teacherId,
      userType: 'student',
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      totalScheduled: scheduledClasses.length,
      attendanceMarked: attendanceRecords.length,
      pending: scheduledClasses.length - attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.status === 'late').length,
      excused: attendanceRecords.filter(a => a.status === 'excused').length
    };

    res.json(summary);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTodayScheduledClasses: exports.getTodayScheduledClasses,
  markScheduledAttendance: exports.markScheduledAttendance,
  getScheduleAttendanceSummary: exports.getScheduleAttendanceSummary
};
