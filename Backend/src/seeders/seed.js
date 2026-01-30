import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Schedule from '../models/Schedule.js';
import Invoice from '../models/Invoice.js';
import Progress from '../models/Progress.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import StudentLeave from '../models/StudentLeave.js';
import TeamMember from '../models/TeamMember.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Lead.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Schedule.deleteMany({});
    await Invoice.deleteMany({});
    await Progress.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await StudentLeave.deleteMany({});
    await TeamMember.deleteMany({});

    console.log('Cleared existing data');

    // Seed Teachers
    const teachers = await Teacher.insertMany([
      {
        name: 'Ustaz Bilal Ahmed',
        title: 'Senior Hafiz',
        phone: '+92300111222',
        email: 'bilal@academy.com',
        specialization: ['Hifz', 'Tajweed'],
        students: 18,
        rating: 4.9,
        classesToday: 6,
        classesCompleted: 4,
        status: 'available',
        performance: 95,
        punctuality: 98,
        completionRate: 96
      },
      {
        name: 'Ustaza Maryam Khan',
        title: 'Tajweed Specialist',
        phone: '+92300333444',
        email: 'maryam@academy.com',
        specialization: ['Tajweed', 'Nazra'],
        students: 22,
        rating: 4.8,
        classesToday: 8,
        classesCompleted: 5,
        status: 'in_class',
        performance: 92,
        punctuality: 95,
        completionRate: 94
      },
      {
        name: 'Ustaz Omar Farooq',
        title: 'Qaida Expert',
        phone: '+92300555666',
        email: 'omar@academy.com',
        specialization: ['Qaida', 'Nazra'],
        students: 25,
        rating: 4.7,
        classesToday: 7,
        classesCompleted: 7,
        status: 'available',
        performance: 88,
        punctuality: 90,
        completionRate: 92
      },
      {
        name: 'Ustaza Aisha Rahman',
        title: 'Hifz Teacher',
        phone: '+92300777888',
        email: 'aisha@academy.com',
        specialization: ['Hifz', 'Nazra'],
        students: 15,
        rating: 4.9,
        classesToday: 5,
        classesCompleted: 2,
        status: 'in_class',
        performance: 96,
        punctuality: 97,
        completionRate: 98
      }
    ]);

    console.log('Teachers seeded');

    // Seed Students
    const students = await Student.insertMany([
      {
        name: 'Ahmed Hassan Jr.',
        age: 8,
        country: 'Pakistan',
        timezone: 'GMT+5',
        course: 'Hifz',
        teacher: teachers[0].name,
        teacherId: teachers[0]._id,
        schedule: 'Mon, Wed, Fri - 4:00 PM',
        progress: 35,
        status: 'active',
        feeAmount: 150
      },
      {
        name: 'Sara Khan',
        age: 12,
        country: 'UK',
        timezone: 'GMT+0',
        course: 'Tajweed',
        teacher: teachers[1].name,
        teacherId: teachers[1]._id,
        schedule: 'Tue, Thu - 5:00 PM',
        progress: 68,
        status: 'active',
        feeAmount: 120
      },
      {
        name: 'Yusuf Ibrahim',
        age: 6,
        country: 'USA',
        timezone: 'GMT-5',
        course: 'Qaida',
        teacher: teachers[2].name,
        teacherId: teachers[2]._id,
        schedule: 'Daily - 3:00 PM',
        progress: 89,
        status: 'active',
        feeAmount: 100
      },
      {
        name: 'Fatima Ahmed',
        age: 10,
        country: 'UAE',
        timezone: 'GMT+4',
        course: 'Nazra',
        teacher: teachers[3].name,
        teacherId: teachers[3]._id,
        schedule: 'Mon, Wed - 6:00 PM',
        progress: 45,
        status: 'on_hold',
        feeAmount: 130,
        leaveReason: 'Financial Constraints'
      },
      {
        name: 'Omar Sheikh',
        age: 14,
        country: 'Saudi Arabia',
        timezone: 'GMT+3',
        course: 'Hifz',
        teacher: teachers[0].name,
        teacherId: teachers[0]._id,
        schedule: 'Daily - 7:00 AM',
        progress: 72,
        status: 'active',
        feeAmount: 180
      }
    ]);

    console.log('Students seeded');

    // Seed Leads
    await Lead.insertMany([
      {
        name: 'Ahmed Hassan',
        phone: '+92301234567',
        email: 'ahmed@email.com',
        country: 'Pakistan',
        course: 'Hifz',
        status: 'new',
        assignedTo: 'Fatima Sales',
        source: 'Facebook',
        notes: 'Interested in weekend classes',
        callLogs: []
      },
      {
        name: 'Sara Khan',
        phone: '+44789012345',
        email: 'sara@email.com',
        country: 'UK',
        course: 'Tajweed',
        status: 'follow_up',
        assignedTo: 'Fatima Sales',
        source: 'Website',
        notes: 'Need to schedule trial',
        callLogs: []
      },
      {
        name: 'Mohammed Ali',
        phone: '+1234567890',
        email: 'mohammed@email.com',
        country: 'USA',
        course: 'Nazra',
        status: 'trial',
        assignedTo: 'Fatima Sales',
        source: 'Referral',
        notes: 'Trial scheduled for Monday',
        callLogs: []
      },
      {
        name: 'Yusuf Ibrahim',
        phone: '+971501234567',
        email: 'yusuf@email.com',
        country: 'UAE',
        course: 'Qaida',
        status: 'enrolled',
        assignedTo: 'Omar',
        source: 'Instagram',
        notes: 'Started regular classes',
        callLogs: []
      },
      {
        name: 'Fatima Ahmed',
        phone: '+966501234567',
        email: 'fatima@email.com',
        country: 'Saudi Arabia',
        course: 'Hifz',
        status: 'closed',
        assignedTo: 'Omar',
        source: 'WhatsApp',
        notes: 'Not interested anymore',
        callLogs: []
      }
    ]);

    console.log('Leads seeded');

    // Seed Schedules
    await Schedule.insertMany([
      {
        studentName: students[0].name,
        studentId: students[0]._id,
        teacherName: teachers[0].name,
        teacherId: teachers[0]._id,
        course: 'Hifz',
        time: '09:00 AM',
        duration: '45 min',
        status: 'completed',
        day: 'Monday'
      },
      {
        studentName: students[1].name,
        studentId: students[1]._id,
        teacherName: teachers[1].name,
        teacherId: teachers[1]._id,
        course: 'Tajweed',
        time: '10:00 AM',
        duration: '30 min',
        status: 'in_progress',
        day: 'Monday'
      },
      {
        studentName: students[2].name,
        studentId: students[2]._id,
        teacherName: teachers[2].name,
        teacherId: teachers[2]._id,
        course: 'Qaida',
        time: '02:00 PM',
        duration: '30 min',
        status: 'scheduled',
        day: 'Monday'
      },
      {
        studentName: students[3].name,
        studentId: students[3]._id,
        teacherName: teachers[3].name,
        teacherId: teachers[3]._id,
        course: 'Nazra',
        time: '04:00 PM',
        duration: '45 min',
        status: 'scheduled',
        day: 'Monday'
      },
      {
        studentName: students[4].name,
        studentId: students[4]._id,
        teacherName: teachers[0].name,
        teacherId: teachers[0]._id,
        course: 'Hifz',
        time: '07:00 AM',
        duration: '60 min',
        status: 'completed',
        day: 'Monday'
      }
    ]);

    console.log('Schedules seeded');

    // Seed Invoices
    await Invoice.insertMany([
      {
        studentName: students[0].name,
        studentId: students[0]._id,
        amount: 150,
        month: 'January 2024',
        status: 'paid',
        dueDate: new Date('2024-01-05'),
        paidAmount: 150,
        estimatedAmount: 150
      },
      {
        studentName: students[1].name,
        studentId: students[1]._id,
        amount: 120,
        month: 'January 2024',
        status: 'unpaid',
        dueDate: new Date('2024-01-10'),
        paidAmount: 0,
        estimatedAmount: 120
      },
      {
        studentName: students[2].name,
        studentId: students[2]._id,
        amount: 100,
        month: 'January 2024',
        status: 'overdue',
        dueDate: new Date('2024-01-01'),
        paidAmount: 0,
        estimatedAmount: 100
      },
      {
        studentName: students[3].name,
        studentId: students[3]._id,
        amount: 130,
        month: 'January 2024',
        status: 'partial',
        dueDate: new Date('2024-01-15'),
        paidAmount: 65,
        estimatedAmount: 130
      },
      {
        studentName: students[4].name,
        studentId: students[4]._id,
        amount: 180,
        month: 'January 2024',
        status: 'paid',
        dueDate: new Date('2024-01-08'),
        paidAmount: 180,
        estimatedAmount: 180
      }
    ]);

    console.log('Invoices seeded');

    // Seed Progress Records
    await Progress.insertMany([
      {
        studentId: students[0]._id,
        studentName: students[0].name,
        date: new Date(),
        lesson: 'Surah Al-Baqarah (Ayah 1-5)',
        sabqi: 'Completed',
        manzil: 'Juz 1',
        notes: 'Excellent tajweed',
        completion: 35
      },
      {
        studentId: students[1]._id,
        studentName: students[1].name,
        date: new Date(),
        lesson: 'Tajweed Rules - Noon Sakinah',
        sabqi: 'In Progress',
        manzil: 'Chapter 3',
        notes: 'Needs more practice',
        completion: 68
      }
    ]);

    console.log('Progress records seeded');

    // Seed Student Leaves
    await StudentLeave.insertMany([
      {
        studentId: students[3]._id,
        studentName: students[3].name,
        reason: 'Financial Constraints',
        date: new Date('2024-01-10')
      },
      {
        studentId: students[3]._id,
        studentName: 'Khadija Ali',
        reason: 'Move to local Mosque',
        date: new Date('2024-01-08')
      },
      {
        studentId: students[3]._id,
        studentName: 'Hamza Khan',
        reason: 'Too young',
        date: new Date('2024-01-05')
      }
    ]);

    console.log('Student leaves seeded');

    // Seed Conversations
    const conversations = await Conversation.insertMany([
      {
        name: 'Ahmed Hassan Jr.',
        phone: '+92******567',
        type: 'student',
        lastMessage: 'Thank you for the update on my progress',
        time: '10:30 AM',
        unread: 0
      },
      {
        name: 'Ustaz Bilal',
        phone: '+92******222',
        type: 'teacher',
        lastMessage: 'The student completed today\'s lesson well',
        time: '09:45 AM',
        unread: 0
      }
    ]);

    // Seed Messages
    await Message.insertMany([
      {
        conversationId: conversations[0]._id,
        content: 'Assalamu Alaikum, how is my Hifz going?',
        time: '10:00 AM',
        sender: 'them',
        status: 'read'
      },
      {
        conversationId: conversations[0]._id,
        content: 'Wa Alaikum Assalam! You\'re making excellent progress.',
        time: '10:15 AM',
        sender: 'me',
        status: 'read'
      }
    ]);

    console.log('Conversations and messages seeded');

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());
