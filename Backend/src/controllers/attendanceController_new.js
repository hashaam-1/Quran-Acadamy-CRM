const Attendance = require('../models/Attendance.js');
const Student = require('../models/Student.js');
const Teacher = require('../models/Teacher.js');

// Get all attendance
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

// Get students for teacher to mark attendance
exports.getStudentsForAttendance = async (req, res) => {
  try {
    const { teacherId, date } = req.query;
    
    const students = await Student.find({ teacherId })
      .select('name email course teacherId status')
      .sort({ name: 1 });

    let attendanceRecords = [];
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      attendanceRecords = await Attendance.find({
        studentId: { $in: students.map(s => s._id) },
        date: { $gte: startDate, $lte: endDate }
      }).select('studentId status checkInTime');
    }

    const studentsWithAttendance = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        course: student.course,
        status: student.status,
        attendanceStatus: attendance ? attendance.status : 'not_marked',
        checkInTime: attendance ? attendance.checkInTime : null
      };
    });

    res.json(studentsWithAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status, classTime, course } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      studentId,
      date: { $gte: today }
    });

    if (attendance) {
      attendance.status = status;
      attendance.classTime = classTime || attendance.classTime;
      attendance.course = course || attendance.course;
      if (status === 'present') {
        attendance.checkInTime = new Date().toLocaleTimeString();
      }
      await attendance.save();
    } else {
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
