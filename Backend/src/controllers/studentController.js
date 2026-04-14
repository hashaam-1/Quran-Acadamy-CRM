const Student = require('../../models/Student.js');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../config/email.js');
const { generatePassword } = require('../utils/passwordGenerator.js');

// Student login
exports.studentLogin = async (req, res) => {
  try {
    console.log('Student login endpoint called with body:', req.body);
    const { email, password } = req.body;
    
    // Find student by email
    const student = await Student.findOne({ email }).populate('teacherId', 'name email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Return student data without password
    const studentData = {
      _id: student._id,
      name: student.name,
      email: student.email,
      age: student.age,
      country: student.country,
      timezone: student.timezone,
      course: student.course,
      teacher: student.teacher,
      teacherId: student.teacherId,
      schedule: student.schedule,
      progress: student.progress,
      status: student.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
    
    res.json(studentData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const { teacherId } = req.query;
    let filter = {};
    
    if (teacherId) {
      filter.teacherId = teacherId;
    }
    
    const students = await Student.find(filter)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const mappedStudents = students.map(student => ({
      ...student.toObject(),
      id: student._id.toString()
    }));
    
    console.log(`Fetching students: Found ${mappedStudents.length} students`);
    res.json(mappedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single student
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('teacherId', 'name email phone');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Map _id to id for frontend compatibility
    const mappedStudent = {
      ...student.toObject(),
      id: student._id.toString()
    };
    
    res.json(mappedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, age, country, timezone, course, teacher, teacherId, schedule } = req.body;
    
    console.log('Creating student with data:', { name, email, passwordProvided: !!password, providedPassword: password });
    
    // Use email as userId for login
    const userId = email;
    
    // Auto-generate password if not provided
    const autoPassword = password || generatePassword(12);
    
    console.log('Using password:', autoPassword, 'Generated:', !password);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(autoPassword, 10);
    
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      plainPassword: autoPassword, // Store auto-generated password for admin viewing
      userId,
      age,
      country,
      timezone,
      course,
      teacher,
      teacherId,
      schedule,
      status: 'active',
      progress: 0,
    });
    
    const newStudent = await student.save();
    
    // Send credentials email asynchronously (non-blocking)
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;
    const emailTemplate = emailTemplates.studentCredentials({
      name,
      email,
      password: autoPassword, // Include auto-generated password
      loginUrl,
    });
    
    // Send email asynchronously without blocking the response
    sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).then(emailResult => {
      console.log('Email sent to student:', emailResult.success ? 'Success' : 'Failed');
      if (!emailResult.success) {
        console.error('Email error:', emailResult.error);
      }
    }).catch(error => {
      console.error('Email sending failed:', error);
    });
    
    // Return the student with auto-generated password for admin display
    res.status(201).json({
      ...newStudent.toObject(),
      id: newStudent._id.toString(),
      plainPassword: autoPassword,
      emailSent: true
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students statistics
exports.getStudentsStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const active = await Student.countDocuments({ status: 'active' });
    const inactive = await Student.countDocuments({ status: 'inactive' });
    const onHold = await Student.countDocuments({ status: 'on_hold' });
    
    const byCourse = await Student.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      total,
      active,
      inactive,
      onHold,
      byCourse: byCourse.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students by teacher
exports.getStudentsByTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    console.log(`getStudentsByTeacher called with teacherId: ${teacherId}`);
    
    // First, get the teacher's name to match both by ID and name
    const Teacher = require('../../models/Teacher');
    const teacher = await Teacher.findById(teacherId);
    const teacherName = teacher ? teacher.name : null;
    
    console.log(`Teacher found: ${teacherName} for ID: ${teacherId}`);
    
    // Find students by either teacherId OR teacher name (to handle legacy data)
    let filter = {};
    if (teacherName) {
      filter = {
        $or: [
          { teacherId: teacherId },
          { teacher: teacherName }
        ]
      };
    } else {
      filter = { teacherId: teacherId };
    }
    
    console.log('Using filter:', filter);
    
    const students = await Student.find(filter)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${students.length} students for teacher ${teacherId} (${teacherName})`);
    console.log('Students found:', students.map(s => ({
      name: s.name,
      teacherId: s.teacherId,
      teacher: s.teacher
    })));
    
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsByTeacher:', error);
    res.status(500).json({ message: error.message });
  }
};

// Resend student credentials
exports.resendStudentCredentials = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Send credentials email asynchronously (non-blocking)
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;
    const emailTemplate = emailTemplates.studentCredentials({
      name: student.name,
      email: student.email,
      password: student.plainPassword || '(Use password reset if forgotten)',
      loginUrl,
    });
    
    // Send email asynchronously without blocking the response
    sendEmail({
      to: student.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    }).then(emailResult => {
      console.log('Email resent to student:', emailResult.success ? 'Success' : 'Failed');
      if (!emailResult.success) {
        console.error('Email error:', emailResult.error);
      }
    }).catch(error => {
      console.error('Email sending failed:', error);
    });

    res.json({ 
      success: true,
      message: 'Credentials will be sent to student email',
      email: student.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
