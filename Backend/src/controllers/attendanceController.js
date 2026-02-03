const Attendance = require('../models/Attendance.js');
const Student = require('../models/Student.js');
const Teacher = require('../models/Teacher.js');
const Schedule = require('../models/Schedule.js');

// Get all attendance
exports.getAttendance = async (req, res) => {
  try {
    const { date, studentId, teacherId, status, userType } = req.query;
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
    if (userType) filter.userType = userType;

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .sort({ date: -1, createdAt: -1 });

    // Map _id to id for frontend compatibility
    const mappedAttendance = attendance.map(record => ({
      ...record.toObject(),
      id: record._id.toString()
    }));

    console.log(`Fetching attendance: Found ${mappedAttendance.length} records`);
    res.json(mappedAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
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
      }).select('studentId status checkInTime checkOutTime');
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
        checkInTime: attendance ? attendance.checkInTime : null,
        checkOutTime: attendance ? attendance.checkOutTime : null
      };
    });

    res.json(studentsWithAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to compare times and determine if late
const isStudentLate = (scheduledTime, checkInTime) => {
  try {
    // Parse scheduled time (e.g., "10:00 AM")
    const scheduledDate = new Date();
    const [time, period] = scheduledTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // Parse check-in time
    const checkInDate = new Date();
    const [checkTime, checkPeriod] = checkInTime.split(' ');
    let [checkHours, checkMinutes] = checkTime.split(':').map(Number);
    
    if (checkPeriod === 'PM' && checkHours !== 12) checkHours += 12;
    if (checkPeriod === 'AM' && checkHours === 12) checkHours = 0;
    
    checkInDate.setHours(checkHours, checkMinutes, 0, 0);
    
    // Allow 5 minute grace period
    const graceMinutes = 5;
    const gracePeriod = graceMinutes * 60 * 1000;
    
    return checkInDate.getTime() > (scheduledDate.getTime() + gracePeriod);
  } catch (error) {
    console.error('Error comparing times:', error);
    return false;
  }
};

// Mark student attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status, classTime, course, scheduleId } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const today = new Date();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    today.setHours(0, 0, 0, 0);

    // Get schedule information - either from scheduleId or find today's schedule
    let scheduleInfo = {};
    let schedule = null;
    
    if (scheduleId) {
      schedule = await Schedule.findById(scheduleId);
    } else {
      // Find today's scheduled class for this student
      schedule = await Schedule.findOne({
        studentId: studentId,
        day: currentDay,
        status: 'scheduled'
      });
    }
    
    if (schedule) {
      scheduleInfo = {
        scheduleId: schedule._id,
        scheduledTime: schedule.time,
        scheduledDay: schedule.day,
        duration: schedule.duration
      };
    }

    let attendance = await Attendance.findOne({
      studentId,
      userType: 'student',
      date: { $gte: today }
    });

    const now = new Date();
    const actualTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    // Auto-determine if student is late based on scheduled time
    let finalStatus = status;
    if (schedule && schedule.time && (status === 'present' || !status)) {
      const isLate = isStudentLate(schedule.time, actualTime);
      finalStatus = isLate ? 'late' : 'present';
      console.log(`Student check-in: Scheduled=${schedule.time}, Actual=${actualTime}, Status=${finalStatus}`);
    }

    if (attendance) {
      // If attendance already exists, update check-out time if check-in is already set
      if (attendance.checkInTime && !attendance.checkOutTime && (status === 'checkout' || status === 'checked_out')) {
        attendance.checkOutTime = actualTime;
        attendance.status = 'present'; // Mark as present after checkout
        console.log(`Student check-out: ${student.name} at ${actualTime}`);
      } 
      // If this is a check-in and no check-in time exists yet
      else if (!attendance.checkInTime && (finalStatus === 'present' || finalStatus === 'late')) {
        attendance.checkInTime = actualTime;
        attendance.status = finalStatus;
        console.log(`Student check-in: ${student.name} at ${actualTime}`);
      }
      // Update other fields
      attendance.classTime = scheduleInfo.scheduledTime || classTime || attendance.classTime;
      attendance.course = course || attendance.course;
      
      // Update schedule info if found
      if (schedule) {
        Object.assign(attendance, scheduleInfo);
      }
      await attendance.save();
    } else {
      // Create new attendance record only for check-in
      attendance = new Attendance({
        userType: 'student',
        studentId,
        studentName: student.name,
        teacherId: student.teacherId,
        teacherName: student.teacher,
        course: course || student.course,
        classTime: scheduleInfo.scheduledTime || classTime || '09:00 AM',
        status: finalStatus,
        checkInTime: (finalStatus === 'present' || finalStatus === 'late') ? actualTime : null,
        ...scheduleInfo
      });
      await attendance.save();
      console.log(`New attendance record created for ${student.name}`);
    }

    // Map _id to id for frontend compatibility
    const mappedAttendance = {
      ...attendance.toObject(),
      id: attendance._id.toString()
    };

    res.json(mappedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

// Mark teacher attendance (check-in/check-out)
exports.markTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, status } = req.body; // status can be 'checkin', 'checkout', 'present', 'absent'
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance already exists for today
    let attendance = await Attendance.findOne({
      teacherId,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    });

    const now = new Date();
    const actualTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    if (attendance) {
      // If attendance already exists, update check-out time if check-in is already set
      if (attendance.checkInTime && !attendance.checkOutTime && (status === 'checkout' || status === 'checked_out')) {
        attendance.checkOutTime = actualTime;
        attendance.status = 'present'; // Mark as present after checkout
        console.log(`Teacher check-out: ${teacher.name} at ${actualTime}`);
      } 
      // If this is a check-in and no check-in time exists yet
      else if (!attendance.checkInTime && (status === 'checkin' || status === 'present')) {
        attendance.checkInTime = actualTime;
        attendance.status = 'present';
        console.log(`Teacher check-in: ${teacher.name} at ${actualTime}`);
      }
      // Update status if explicitly provided
      else if (status === 'present' || status === 'absent') {
        attendance.status = status;
      }
      await attendance.save();
    } else {
      // Create new attendance record only for check-in
      attendance = new Attendance({
        userType: 'teacher',
        teacherId,
        teacherName: teacher.name,
        date: today,
        status: status === 'absent' ? 'absent' : 'present',
        checkInTime: (status === 'checkin' || status === 'present') ? actualTime : null,
      });
      await attendance.save();
      console.log(`New teacher attendance record created for ${teacher.name}`);
    }

    // Map _id to id for frontend compatibility
    const mappedAttendance = {
      ...attendance.toObject(),
      id: attendance._id.toString()
    };

    res.json(mappedAttendance);
  } catch (error) {
    console.error('Error marking teacher attendance:', error);
    res.status(400).json({ message: error.message });
  }
};

// Clean up duplicate teacher attendance records
exports.cleanupTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, date } = req.query;
    
    let filter = { userType: 'teacher' };
    if (teacherId) filter.teacherId = teacherId;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Get all teacher attendance records
    const allRecords = await Attendance.find(filter).sort({ teacherId: 1, date: 1, createdAt: 1 });
    
    // Group by teacher and date
    const grouped = {};
    allRecords.forEach(record => {
      const key = `${record.teacherId}_${record.date.toDateString()}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    let totalMerged = 0;
    let totalDeleted = 0;

    // Process each group
    for (const [key, records] of Object.entries(grouped)) {
      if (records.length > 1) {
        console.log(`Processing group ${key}: ${records.length} records`);
        
        // Merge records
        const merged = records.reduce((acc, record) => {
          if (!acc.checkInTime && record.checkInTime) {
            acc.checkInTime = record.checkInTime;
          }
          if (!acc.checkOutTime && record.checkOutTime) {
            acc.checkOutTime = record.checkOutTime;
          }
          if (!acc.date) acc.date = record.date;
          if (!acc.teacherId) acc.teacherId = record.teacherId;
          if (!acc.teacherName) acc.teacherName = record.teacherName;
          return acc;
        }, {});

        // Update the first record
        await Attendance.findByIdAndUpdate(records[0]._id, {
          checkInTime: merged.checkInTime,
          checkOutTime: merged.checkOutTime,
          status: 'present'
        });

        // Delete the rest
        for (let i = 1; i < records.length; i++) {
          await Attendance.findByIdAndDelete(records[i]._id);
          totalDeleted++;
        }

        totalMerged++;
      }
    }

    res.json({
      message: 'Cleanup completed',
      totalGroups: Object.keys(grouped).length,
      groupsMerged: totalMerged,
      recordsDeleted: totalDeleted
    });
  } catch (error) {
    console.error('Error cleaning up teacher attendance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by student
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const attendance = await Attendance.find({ studentId })
      .populate('teacherId', 'name email')
      .sort({ date: -1 });
    
    console.log(`Fetching attendance for student ${studentId}: Found ${attendance.length} records`);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
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
      }).select('studentId status checkInTime checkOutTime');
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
        checkInTime: attendance ? attendance.checkInTime : null,
        checkOutTime: attendance ? attendance.checkOutTime : null
      };
    });

    res.json(studentsWithAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
