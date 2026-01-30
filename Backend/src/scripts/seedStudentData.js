const mongoose = require('mongoose');
const Student = require('../models/Student.js');
const Progress = require('../models/Progress.js');
const Homework = require('../models/Homework.js');
const Invoice = require('../models/Invoice.js');
const Schedule = require('../models/Schedule.js');
const Attendance = require('../models/Attendance.js');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quran-academy-crm')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedStudentData() {
  try {
    // Find student "MUHAMMAD HASNAIN" with email "husnain123@gmail.com"
    const student = await Student.findOne({ email: 'husnain123@gmail.com' });
    
    if (!student) {
      console.log('Student not found. Please create the student first.');
      return;
    }

    console.log('Found student:', student.name, 'ID:', student._id);

    // Get student's teacher
    const teacherId = student.teacherId;

    // 1. Create Progress Records
    console.log('\n📊 Creating progress records...');
    const progressRecords = [
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        lesson: 'Surah Al-Baqarah (1-10)',
        sabqi: 'Surah Al-Fatiha',
        manzil: 'Surah Al-Fatiha',
        notes: 'Good progress, needs to work on tajweed',
        completion: 75,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        lesson: 'Surah Al-Baqarah (11-20)',
        sabqi: 'Surah Al-Baqarah (1-10)',
        manzil: 'Surah Al-Fatiha',
        notes: 'Excellent memorization, keep up the good work',
        completion: 85,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        lesson: 'Surah Al-Baqarah (21-30)',
        sabqi: 'Surah Al-Baqarah (11-20)',
        manzil: 'Surah Al-Baqarah (1-10)',
        notes: 'Outstanding performance!',
        completion: 90,
        date: new Date(), // Today
      }
    ];

    await Progress.deleteMany({ studentId: student._id });
    const createdProgress = await Progress.insertMany(progressRecords);
    console.log(`✅ Created ${createdProgress.length} progress records`);

    // Update student's overall progress
    await Student.findByIdAndUpdate(student._id, { progress: 90 });
    console.log('✅ Updated student overall progress to 90%');

    // 2. Create Homework Assignments
    console.log('\n📚 Creating homework assignments...');
    const homeworkList = [
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        course: student.course,
        title: 'Memorize Surah Al-Mulk',
        description: 'Memorize the complete Surah Al-Mulk with proper tajweed and pronunciation.',
        assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        priority: 'high'
      },
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        course: student.course,
        title: 'Review Tajweed Rules',
        description: 'Review and practice Qalqalah and Ghunnah rules with examples.',
        assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed',
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        submissionNotes: 'Completed all exercises and practiced with examples.',
        grade: 'excellent',
        teacherFeedback: 'Excellent work! Your understanding of tajweed rules is impressive.',
        priority: 'medium'
      },
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        course: student.course,
        title: 'Practice Surah Al-Fatiha Recitation',
        description: 'Practice reciting Surah Al-Fatiha with perfect tajweed 10 times daily.',
        assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        priority: 'medium'
      },
      {
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        course: student.course,
        title: 'Complete Juz 1 Revision',
        description: 'Revise and recite complete Juz 1 from memory.',
        assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'overdue',
        priority: 'high'
      }
    ];

    await Homework.deleteMany({ studentId: student._id });
    const createdHomework = await Homework.insertMany(homeworkList);
    console.log(`✅ Created ${createdHomework.length} homework assignments`);

    // 3. Create Invoices
    console.log('\n💰 Creating invoices...');
    const invoices = [
      {
        studentName: student.name,
        studentId: student._id,
        amount: 100,
        month: 'January 2026',
        status: 'paid',
        dueDate: new Date('2026-01-15'),
        paidAmount: 100,
        discount: 0
      },
      {
        studentName: student.name,
        studentId: student._id,
        amount: 100,
        month: 'February 2026',
        status: 'partial',
        dueDate: new Date('2026-02-15'),
        paidAmount: 50,
        discount: 0
      },
      {
        studentName: student.name,
        studentId: student._id,
        amount: 100,
        month: 'March 2026',
        status: 'unpaid',
        dueDate: new Date('2026-03-15'),
        paidAmount: 0,
        discount: 0
      }
    ];

    await Invoice.deleteMany({ studentId: student._id });
    const createdInvoices = await Invoice.insertMany(invoices);
    console.log(`✅ Created ${createdInvoices.length} invoices`);

    // 4. Create Schedule
    console.log('\n📅 Creating schedule...');
    const schedules = [
      {
        studentName: student.name,
        studentId: student._id,
        teacherName: student.teacher,
        teacherId: teacherId,
        course: student.course,
        time: '10:00 AM',
        duration: '45 min',
        status: 'scheduled',
        day: 'Monday'
      },
      {
        studentName: student.name,
        studentId: student._id,
        teacherName: student.teacher,
        teacherId: teacherId,
        course: student.course,
        time: '10:00 AM',
        duration: '45 min',
        status: 'scheduled',
        day: 'Wednesday'
      },
      {
        studentName: student.name,
        studentId: student._id,
        teacherName: student.teacher,
        teacherId: teacherId,
        course: student.course,
        time: '10:00 AM',
        duration: '45 min',
        status: 'scheduled',
        day: 'Friday'
      }
    ];

    await Schedule.deleteMany({ studentId: student._id });
    const createdSchedules = await Schedule.insertMany(schedules);
    console.log(`✅ Created ${createdSchedules.length} schedule entries`);

    // 5. Create Attendance Records
    console.log('\n✅ Creating attendance records...');
    const attendanceRecords = [];
    const statuses = ['present', 'present', 'present', 'present', 'late', 'present', 'absent', 'present', 'present', 'present'];
    
    for (let i = 0; i < 10; i++) {
      attendanceRecords.push({
        userType: 'student',
        studentId: student._id,
        studentName: student.name,
        teacherId: teacherId,
        teacherName: student.teacher,
        course: student.course,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: statuses[i],
        notes: statuses[i] === 'present' ? 'Attended class on time' : 
               statuses[i] === 'late' ? 'Arrived 10 minutes late' : 
               'Did not attend class'
      });
    }

    await Attendance.deleteMany({ studentId: student._id });
    const createdAttendance = await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Created ${createdAttendance.length} attendance records`);

    console.log('\n🎉 Successfully seeded all student data!');
    console.log('\nSummary:');
    console.log(`- Student: ${student.name}`);
    console.log(`- Progress Records: ${createdProgress.length}`);
    console.log(`- Homework Assignments: ${createdHomework.length}`);
    console.log(`- Invoices: ${createdInvoices.length}`);
    console.log(`- Schedule Entries: ${createdSchedules.length}`);
    console.log(`- Attendance Records: ${createdAttendance.length}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

seedStudentData();
