const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quran-academy-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));

async function assignStudentToFahad() {
  try {
    console.log('Assigning Hassan to teacher Fahad...');

    const fahadTeacherId = '696f6c6f1b976e25f3c3a942';
    const hassanStudentId = '6967fbccb4e1ba895683b532';

    // Update Hassan's teacher to Fahad
    const result = await Student.findByIdAndUpdate(
      hassanStudentId,
      {
        teacher: 'Fahad',
        teacherId: fahadTeacherId
      },
      { new: true }
    );

    if (result) {
      console.log('Successfully assigned Hassan to Fahad');
      console.log('Updated student:', {
        name: result.name,
        teacher: result.teacher,
        teacherId: result.teacherId
      });
    } else {
      console.log('Student not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error assigning student:', error);
    process.exit(1);
  }
}

assignStudentToFahad();
