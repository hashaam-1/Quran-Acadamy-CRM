const Attendance = require('../models/Attendance.js');
const Student = require('../models/Student.js');
const Teacher = require('../models/Teacher.js');

// Get all attendance records
exports.getAttendance = async (req, res) => {
  try {
    const { date, studentId, teacherId, status } = req.query;
    const filter = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (studentId) filter.studentId = studentId;
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'name')
      .populate('teacherId', 'name')
      .sort({ date: -1, classTime: 1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('studentId')
      .populate('teacherId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    const newAttendance = await attendance.save();
    
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark student attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status, classTime, course } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    let attendance = await Attendance.findOne({
      studentId,
      date: { $gte: today }
    });

    if (attendance) {
      // Update existing attendance
      attendance.status = status;
      attendance.classTime = classTime || attendance.classTime;
      attendance.course = course || attendance.course;
      if (status === 'present') {
        attendance.checkInTime = new Date().toLocaleTimeString();
      }
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        studentId,
        studentName: student.name,
        teacherId: student.teacherId,
        teacherName: student.teacher,
        course: course || student.course,
        classTime: classTime || '09:00 AM',
        status,
        checkInTime: status === 'present' ? new Date().toLocaleTimeString() : null,
      });
      await attendance.save();
    }

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
