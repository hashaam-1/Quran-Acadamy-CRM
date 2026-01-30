const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quran-academy-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const attendanceSchema = new mongoose.Schema({}, { strict: false });
const Attendance = mongoose.model('Attendance', attendanceSchema);

async function updateAttendanceTeacher() {
  try {
    console.log('Updating attendance records for Hassan to teacher Fahad...');

    const fahadTeacherId = new mongoose.Types.ObjectId('696f6c6f1b976e25f3c3a942');
    const hassanStudentId = new mongoose.Types.ObjectId('6967fbccb4e1ba895683b532');

    // Update all Hassan's attendance records to show Fahad as teacher
    const result = await Attendance.updateMany(
      { studentId: hassanStudentId },
      {
        teacherId: fahadTeacherId,
        teacherName: 'Fahad'
      }
    );

    console.log(`Updated ${result.modifiedCount} attendance records`);
    console.log('Hassan\'s attendance now shows Fahad as the teacher');

    process.exit(0);
  } catch (error) {
    console.error('Error updating attendance:', error);
    process.exit(1);
  }
}

updateAttendanceTeacher();
