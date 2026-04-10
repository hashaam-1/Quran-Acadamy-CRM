const Attendance = require('../models/Attendance');

// Teacher checkout endpoint
exports.teacherCheckout = async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find today's attendance record for the teacher
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Teacher checkout - finding attendance for teacher ${teacherId}`);

    // First, clean up ALL duplicate records for this teacher today
    const allTodayRecords = await Attendance.find({
      teacherId,
      userType: 'teacher',
      date: { $gte: today, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    console.log(`Found ${allTodayRecords.length} attendance records for teacher checkout`);

    let attendance = null;
    
    if (allTodayRecords.length > 0) {
      // Use the first record as the main one and merge others
      attendance = allTodayRecords[0];
      console.log(`Using record ${attendance._id} as main record for checkout`);
      
      // Merge data from other records and delete them
      for (let i = 1; i < allTodayRecords.length; i++) {
        const duplicate = allTodayRecords[i];
        console.log(`Merging and deleting duplicate record ${duplicate._id} during checkout`);
        
        // Merge check-in time if main record doesn't have it
        if (!attendance.checkInTime && duplicate.checkInTime) {
          attendance.checkInTime = duplicate.checkInTime;
          console.log(`Merged checkInTime: ${duplicate.checkInTime}`);
        }
        
        // Merge check-out time if main record doesn't have it
        if (!attendance.checkOutTime && duplicate.checkOutTime) {
          attendance.checkOutTime = duplicate.checkOutTime;
          console.log(`Merged checkOutTime: ${duplicate.checkOutTime}`);
        }
        
        // Delete the duplicate
        await Attendance.findByIdAndDelete(duplicate._id);
      }
      
      // Save the merged record
      await attendance.save();
      console.log(`Successfully merged ${allTodayRecords.length} records into one for checkout`);
    }

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today. Please check in first.' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ 
        message: 'Already checked out today',
        checkOutTime: attendance.checkOutTime 
      });
    }

    // Set checkout time with proper formatting
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    attendance.checkOutTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    
    await attendance.save();

    res.json({
      message: 'Checked out successfully',
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      attendance: {
        ...attendance.toObject(),
        id: attendance._id.toString()
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's today attendance status
exports.getTeacherTodayAttendance = async (req, res) => {
  try {
    const { teacherId } = req.params;

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
      return res.json({ 
        checkedIn: false,
        checkedOut: false,
        message: 'Not checked in yet'
      });
    }

    res.json({
      checkedIn: !!attendance.checkInTime,
      checkedOut: !!attendance.checkOutTime,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      status: attendance.status,
      attendance: {
        ...attendance.toObject(),
        id: attendance._id.toString()
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  teacherCheckout: exports.teacherCheckout,
  getTeacherTodayAttendance: exports.getTeacherTodayAttendance
};
