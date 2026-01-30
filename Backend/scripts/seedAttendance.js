const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quran-academy-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const attendanceSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['student', 'teacher'],
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  studentName: {
    type: String,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  teacherName: {
    type: String,
  },
  course: {
    type: String,
  },
  classTime: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present',
  },
  checkInTime: {
    type: String,
  },
  checkOutTime: {
    type: String,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));

async function seedAttendance() {
  try {
    console.log('Starting attendance seeding...');

    // Get all students
    const students = await Student.find().limit(10);
    console.log(`Found ${students.length} students`);

    if (students.length === 0) {
      console.log('No students found. Please add students first.');
      process.exit(0);
    }

    // Create attendance records for the last 7 days
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      for (const student of students) {
        // Randomly assign status
        const statuses = ['present', 'absent', 'late'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        attendanceRecords.push({
          userType: 'student',
          studentId: student._id,
          studentName: student.name,
          teacherId: student.teacherId,
          teacherName: student.teacher || 'Unknown',
          course: student.course || 'General',
          classTime: '10:00 AM',
          date: date,
          status: randomStatus,
          checkInTime: randomStatus === 'present' || randomStatus === 'late' ? '10:05 AM' : null,
        });
      }
    }

    // Insert attendance records
    await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    console.log('Attendance seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance:', error);
    process.exit(1);
  }
}

seedAttendance();
