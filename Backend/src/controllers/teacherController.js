const Teacher = require('../models/Teacher.js');
const Student = require('../models/Student.js');
const Attendance = require('../models/Attendance.js');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../config/email.js');
const { generatePassword } = require('../utils/passwordGenerator.js');

// Teacher login
exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Auto-mark teacher attendance on first login of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      teacherId: teacher._id,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    });

    if (!existingAttendance) {
      const now = new Date();
      const attendance = new Attendance({
        userType: 'teacher',
        teacherId: teacher._id,
        teacherName: teacher.name,
        date: now,
        status: 'present',
        checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      });
      await attendance.save();
      console.log(`Teacher ${teacher.name} checked in at ${attendance.checkInTime}`);
    } else if (!existingAttendance.checkInTime) {
      // Update check-in time if not set
      const now = new Date();
      existingAttendance.checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      await existingAttendance.save();
      console.log(`Teacher ${teacher.name} check-in time updated to ${existingAttendance.checkInTime}`);
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
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const mappedTeachers = teachers.map(teacher => ({
      ...teacher.toObject(),
      id: teacher._id.toString()
    }));
    
    console.log(`Fetching teachers: Found ${mappedTeachers.length} teachers`);
    res.json(mappedTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single teacher
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
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
    
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;
    const emailTemplate = emailTemplates.teamMemberCredentials({
      name,
      email,
      role: 'Teacher',
      loginUrl,
      password: temporaryPassword,
    });

    let emailResult = { success: false };
    try {
      emailResult = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (emailError) {
      console.error('Failed to send teacher credentials email:', emailError);
    }

    const teacherResponse = newTeacher.toObject();
    delete teacherResponse.password;
    
    res.status(201).json({
      ...teacherResponse,
      plainPassword: temporaryPassword,
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Teacher created and credentials sent via email' 
        : 'Teacher created but email failed to send',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
