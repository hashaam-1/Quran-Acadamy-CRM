const Teacher = require('../models/Teacher.js');
const Student = require('../models/Student.js');
const Attendance = require('../models/Attendance.js');
const Schedule = require('../models/Schedule.js');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../config/email.js');
const { generatePassword } = require('../utils/passwordGenerator.js');

// Helper function to compare times and determine if teacher is late
const isTeacherLate = (scheduledTime, checkInTime) => {
  try {
    const scheduledDate = new Date();
    const [time, period] = scheduledTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    const checkInDate = new Date();
    const [checkTime, checkPeriod] = checkInTime.split(' ');
    let [checkHours, checkMinutes] = checkTime.split(':').map(Number);
    
    if (checkPeriod === 'PM' && checkHours !== 12) checkHours += 12;
    if (checkPeriod === 'AM' && checkHours === 12) checkHours = 0;
    
    checkInDate.setHours(checkHours, checkMinutes, 0, 0);
    
    const graceMinutes = 5;
    const gracePeriod = graceMinutes * 60 * 1000;
    
    return checkInDate.getTime() > (scheduledDate.getTime() + gracePeriod);
  } catch (error) {
    console.error('Error comparing times:', error);
    return false;
  }
};

// Teacher login
exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Teacher login attempt with email:', email);

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      console.log('Teacher not found for email:', email);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password);

    if (!isPasswordValid) {
      console.log('Invalid password for teacher:', email);
      return res.status(401).json({ message: 'Invalid password' });
    }

    console.log('Teacher authentication successful for:', teacher.name);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const existingAttendance = await Attendance.findOne({
        teacherId: teacher._id,
        userType: 'teacher',
        date: { $gte: today, $lte: endOfDay }
      });

      const now = new Date();
      const actualTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });

      if (!existingAttendance) {
        const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        
        const schedule = await Schedule.findOne({
          teacherId: teacher._id,
          day: currentDay,
          status: 'scheduled'
        });

        let status = 'present';
        if (schedule && schedule.time) {
          const isLate = isTeacherLate(schedule.time, actualTime);
          status = isLate ? 'late' : 'present';
          console.log(`Teacher ${teacher.name} check-in: Scheduled=${schedule.time}, Actual=${actualTime}, Status=${status}`);
        }

        const attendance = new Attendance({
          userType: 'teacher',
          teacherId: teacher._id,
          teacherName: teacher.name,
          date: today,
          checkInTime: actualTime,
          status: status,
          scheduledTime: schedule?.time || null,
          course: schedule?.course || 'Quran'
        });
        await attendance.save();
        console.log(`Teacher ${teacher.name} checked in at ${actualTime} with status ${status}`);
      }
    } catch (attendanceError) {
      console.error('Error marking teacher attendance:', attendanceError);
    }

    const teacherData = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      title: teacher.title,
      specialization: teacher.specialization,
      status: teacher.status,
      performance: teacher.performance,
      rating: teacher.rating,
      students: teacher.students,
      classesCompleted: teacher.classesCompleted,
      classesToday: teacher.classesToday,
      availability: teacher.availability,
      schedule: teacher.schedule,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
    
    res.json(teacherData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('name title phone email specialization students rating classesToday classesCompleted status performance punctuality completionRate userId plainPassword passwordChanged createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const mappedTeachers = teachers.map(teacher => ({
      ...teacher.toObject(),
      id: teacher._id.toString()
    }));
    
    console.log(`Fetching teachers: Found ${mappedTeachers.length} teachers`);
    console.log('Teacher data sample:', mappedTeachers[0]);
    res.json(mappedTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single teacher
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('name title phone email specialization students rating classesToday classesCompleted status performance punctuality completionRate userId plainPassword passwordChanged createdAt updatedAt');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Map _id to id for frontend compatibility
    const mappedTeacher = {
      ...teacher.toObject(),
      id: teacher._id.toString()
    };
    
    res.json(mappedTeacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create teacher with email notification
exports.createTeacher = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      title, 
      specialization, 
      status, 
      performance, 
      rating,
      joinedAt 
    } = req.body;
    
    const userId = email;
    const temporaryPassword = password || generatePassword(12);
    
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const teacher = new Teacher({
      name,
      email,
      phone,
      password: hashedPassword,
      plainPassword: temporaryPassword,
      userId,
      title: title || 'Ustaz',
      specialization: specialization || ['Qaida'],
      status: status || 'available',
      performance: performance || 95,
      rating: rating || 4.8,
      students: 0,
      classesCompleted: 0,
      classesToday: 0,
      joinedAt: joinedAt || new Date().toISOString().split('T')[0],
      availability: ['morning', 'afternoon'],
      schedule: [],
    });

    const newTeacher = await teacher.save();
    
    // Send email asynchronously without blocking the response
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;
    const emailTemplate = emailTemplates.teamMemberCredentials({
      name,
      email,
      role: 'Teacher',
      loginUrl,
      password: temporaryPassword,
    });

    // Send email asynchronously
    sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).then(emailResult => {
      console.log('Email sent to teacher:', emailResult.success ? 'Success' : 'Failed');
    }).catch(error => {
      console.error('Email sending failed:', error);
    });

    const teacherResponse = newTeacher.toObject();
    delete teacherResponse.password;
    
    res.status(201).json({
      ...teacherResponse,
      plainPassword: temporaryPassword,
      emailSent: true, // Will be sent asynchronously
      message: 'Teacher created successfully. Credentials will be sent via email.',
    });
  } catch (error) {
    console.error('Teacher creation error:', error);
    
    // Handle specific errors with professional messages
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      const field = Object.keys(error.keyValue)[0];
      if (field === 'email') {
        return res.status(409).json({ 
          message: 'A teacher with this email address already exists.',
          code: 'DUPLICATE_EMAIL',
          field: 'email'
        });
      }
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed. Please check all required fields.',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create teacher. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teachers statistics
exports.getTeachersStats = async (req, res) => {
  try {
    const total = await Teacher.countDocuments();
    const available = await Teacher.countDocuments({ status: 'available' });
    const inClass = await Teacher.countDocuments({ status: 'in_class' });
    const onLeave = await Teacher.countDocuments({ status: 'on_leave' });
    
    const avgPerformance = await Teacher.aggregate([
      {
        $group: {
          _id: null,
          avgPerformance: { $avg: '$performance' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      total,
      available,
      inClass,
      onLeave,
      avgPerformance: avgPerformance[0]?.avgPerformance || 0,
      avgRating: avgPerformance[0]?.avgRating || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update teacher student count
exports.updateTeacherStudentCount = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const studentCount = await Student.countDocuments({ teacherId, status: 'active' });
    
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { students: studentCount },
      { new: true }
    );
    
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's students
exports.getTeacherStudents = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    const students = await Student.find({ teacherId })
      .select('name email age country timezone course status progress schedule createdAt updatedAt')
      .sort({ name: 1 });
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's attendance records
exports.getTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, date } = req.query;
    
    let filter = { teacherId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendance = await Attendance.find(filter)
      .populate('studentId', 'name email course')
      .sort({ date: -1, classTime: 1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Teacher logout
exports.teacherLogout = async (req, res) => {
  try {
    const { teacherId } = req.body;
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

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
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    const now = new Date();
    const actualTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    attendance.checkOutTime = actualTime;
    await attendance.save();
    
    console.log(`Teacher ${teacher.name} checked out at ${actualTime}`);
    
    res.json({ message: 'Checked out successfully', checkOutTime: actualTime });
  } catch (error) {
    console.error('Teacher logout error:', error);
    res.status(500).json({ message: error.message });
  }
};
