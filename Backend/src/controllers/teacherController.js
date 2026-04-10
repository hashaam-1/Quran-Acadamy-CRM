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

    // Auto-mark teacher attendance on login (check-in or check-out)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Teacher ${teacher.name} login - checking attendance for today ${today.toISOString()} to ${endOfDay.toISOString()}`);

    // First, clean up ALL duplicate records for this teacher today
    const allTodayRecords = await Attendance.find({
      teacherId: teacher._id,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    console.log(`Found ${allTodayRecords.length} attendance records for teacher ${teacher.name} today`);
    
    // Debug: Log all found records
    allTodayRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}: ID=${record._id}, date=${record.date}, checkIn=${record.checkInTime}, checkOut=${record.checkOutTime}`);
    });

    let existingAttendance = null;
    
    if (allTodayRecords.length > 0) {
      // Use the first record as the main one and merge others
      existingAttendance = allTodayRecords[0];
      console.log(`Using record ${existingAttendance._id} as main record`);
      
      // Merge data from other records and delete them
      for (let i = 1; i < allTodayRecords.length; i++) {
        const duplicate = allTodayRecords[i];
        console.log(`Merging and deleting duplicate record ${duplicate._id}`);
        
        // Merge check-in time if main record doesn't have it
        if (!existingAttendance.checkInTime && duplicate.checkInTime) {
          existingAttendance.checkInTime = duplicate.checkInTime;
          console.log(`Merged checkInTime: ${duplicate.checkInTime}`);
        }
        
        // Merge check-out time if main record doesn't have it
        if (!existingAttendance.checkOutTime && duplicate.checkOutTime) {
          existingAttendance.checkOutTime = duplicate.checkOutTime;
          console.log(`Merged checkOutTime: ${duplicate.checkOutTime}`);
        }
        
        // Delete the duplicate
        await Attendance.findByIdAndDelete(duplicate._id);
        console.log(`Deleted duplicate record ${duplicate._id}`);
      }
      
      // Save the merged record
      await existingAttendance.save();
      console.log(`Successfully merged ${allTodayRecords.length} records into one`);
    }

    // Get current time with proper formatting
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const actualTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;

    console.log(`Current time: ${actualTime}`);

    if (existingAttendance) {
      console.log(`Existing attendance found: checkIn=${existingAttendance.checkInTime}, checkOut=${existingAttendance.checkOutTime}`);
      
      // If attendance already exists, update check-out time if check-in is already set
      if (existingAttendance.checkInTime && !existingAttendance.checkOutTime) {
        existingAttendance.checkOutTime = actualTime;
        existingAttendance.status = 'present';
        await existingAttendance.save();
        console.log(`Teacher ${teacher.name} checked out at ${actualTime} (updated existing record)`);
      } 
      // If no check-in time exists, set it (this shouldn't happen but handle it)
      else if (!existingAttendance.checkInTime) {
        existingAttendance.checkInTime = actualTime;
        existingAttendance.status = 'present';
        await existingAttendance.save();
        console.log(`Teacher ${teacher.name} checked in at ${actualTime} (updated existing record)`);
      }
      // If both times exist, don't update (already complete)
      else {
        console.log(`Teacher ${teacher.name} already has complete attendance (checkIn=${existingAttendance.checkInTime}, checkOut=${existingAttendance.checkOutTime}) - no update needed`);
      }
    } else {
      // Create new attendance record for check-in
      console.log(`Creating new attendance record for teacher ${teacher.name}`);
      const attendance = new Attendance({
        userType: 'teacher',
        teacherId: teacher._id,
        teacherName: teacher.name,
        date: today, // Use today's date at midnight for proper comparison
        checkInTime: actualTime,
        status: 'present'
      });
      await attendance.save();
      console.log(`Teacher ${teacher.name} new attendance record created, checked in at ${actualTime}, record ID: ${attendance._id}, date: ${attendance.date}`);
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
