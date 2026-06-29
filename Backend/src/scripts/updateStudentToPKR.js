const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

async function updateStudentToPKR() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update student Younas to PKR
    const student = await Student.findOneAndUpdate(
      { email: 'younas@gmail.com' },
      { currency: 'PKR' },
      { new: true }
    );

    if (student) {
      console.log('✅ Updated student currency to PKR:');
      console.log('   Name:', student.name);
      console.log('   Email:', student.email);
      console.log('   Currency:', student.currency);
      console.log('   Country:', student.country);
    } else {
      console.log('❌ Student not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStudentToPKR();
