const Schedule = require('../models/Schedule.js');

// Get all schedules with weekly filtering
const getSchedules = async (req, res) => {
  try {
    console.log('🔍 Fetching schedules with weekly filtering...');
    
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // ✅ FIXED: Accept week parameters from frontend or use current week
    let weekStart, weekEnd;
    
    if (req.query.weekStart && req.query.weekEnd) {
      // Use provided week range from frontend
      weekStart = new Date(req.query.weekStart);
      weekEnd = new Date(req.query.weekEnd);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log('📅 FRONTEND WEEK CHANGE DETECTED!');
      console.log('🔄 Week range from frontend:', {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        source: 'frontend_control'
      });
    } else {
      // Use current week as default
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Start from Monday
      weekStart.setHours(0, 0, 0, 0);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End on Sunday
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log('📅 Using current week (default):', {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        today: today.toISOString().split('T')[0],
        source: 'current_week_default'
      });
    }
    
    // ✅ DEBUG: Check all schedules to see date fields
    const allSchedules = await Schedule.find()
      .populate('studentId', 'name age')
      .populate('teacherId', 'name email')
      .sort({ day: 1, time: 1 });
    
    console.log('🔍 DEBUG: All schedules date fields:');
    allSchedules.forEach(s => {
      console.log(`📅 Schedule ID: ${s._id}, Date: ${s.date}, Day: ${s.day}, Type: ${typeof s.date}`);
    });
    
    // Get total schedules for comparison
    const totalSchedules = allSchedules.length;
    
    // ✅ FIXED: Filter schedules with fallback date calculation
    const getDateFromDay = (dayName) => {
      const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      
      const today = new Date();
      const currentDayIndex = today.getDay();
      const targetDayIndex = days.indexOf(dayName);

      let diff = targetDayIndex - currentDayIndex;
      if (diff <= 0) diff += 7; // If day passed or today, schedule for next week

      const result = new Date(today);
      result.setDate(today.getDate() + diff);
      result.setHours(0, 0, 0, 0);

      return result;
    };
    
    const currentWeekSchedules = allSchedules.filter(schedule => {
      let scheduleDate;
      
      if (schedule.date && schedule.date instanceof Date && !isNaN(schedule.date)) {
        scheduleDate = schedule.date;
      } else {
        scheduleDate = getDateFromDay(schedule.day); // fallback for missing/invalid dates
      }
      
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    });
    
    console.log('✅ Found schedules:', {
      total: totalSchedules,
      currentWeek: currentWeekSchedules.length,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    });
    
    // Debug: Log filtered schedules with their calculated dates
    console.log('📅 Current week schedules:', 
      currentWeekSchedules.map(s => ({
        id: s._id,
        originalDate: s.date,
        calculatedDate: (s.date && s.date instanceof Date && !isNaN(s.date)) 
          ? s.date.toISOString().split('T')[0]
          : getDateFromDay(s.day).toISOString().split('T')[0],
        day: s.day,
        studentName: s.studentName
      }))
    );
    
    // ✅ FIXED: Return consistent response format with weekly filtering
    res.json({
      success: true,
      data: currentWeekSchedules,
      count: currentWeekSchedules.length,
      weekInfo: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalSchedules: totalSchedules,
        currentWeekSchedules: currentWeekSchedules.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching schedules:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Helper function to convert day name to day number (Monday=1, Sunday=7)
const getDayOfWeek = (dayName) => {
  const days = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0 // Use 0 for Sunday to match JavaScript getDay()
  };
  return days[dayName] || 1;
};

// Get all schedules without weekly filtering (for admin purposes)
const getAllSchedules = async (req, res) => {
  try {
    console.log('🔍 Fetching ALL schedules (no weekly filter)...');
    
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const schedules = await Schedule.find()
      .populate('studentId', 'name age')
      .populate('teacherId', 'name email')
      .sort({ day: 1, time: 1 });
    
    console.log('✅ Found all schedules:', schedules.length);
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    console.error('❌ Error fetching all schedules:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get single schedule
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('studentId')
      .populate('teacherId');
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create schedule
const createSchedule = async (req, res) => {
  try {
    const { createZoomMeeting } = require('./meetingController');
    
    // ✅ Create REAL Zoom meeting first
    const meetingDateTime = new Date();
    meetingDateTime.setHours(meetingDateTime.getHours() + 1); // 1 hour from now
    
    const zoomMeeting = await createZoomMeeting({
      topic: `${req.body.course || 'Quran'} Class - ${req.body.studentName || 'Student'}`,
      startTime: meetingDateTime.toISOString(),
      duration: parseInt(req.body.duration) || 60
    });
    
    if (!zoomMeeting || !zoomMeeting.id) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create Zoom meeting" 
      });
    }
    
    console.log('✅ Real Zoom meeting created:', zoomMeeting.id);
    
    // ✅ Save meeting to Meeting collection as well
    const Meeting = require('../models/Meeting');
    const meeting = new Meeting({
      className: req.body.className || `${req.body.course || 'Quran'} Class`, // ✅ REQUIRED: Add className
      meetingNumber: zoomMeeting.id.toString(), // ✅ REAL Zoom meeting ID as string
      zoomMeetingId: zoomMeeting.id.toString(),
      joinUrl: zoomMeeting.join_url,
      startUrl: zoomMeeting.start_url,
      password: zoomMeeting.password || "123456",
      zoomPassword: zoomMeeting.password || "123456", // ✅ Store Zoom password
      plainPassword: zoomMeeting.password || "123456", // ✅ Store plain password
      topic: `${req.body.course || 'Quran'} Class - ${req.body.studentName || 'Student'}`,
      teacherId: req.body.teacherId,
      studentId: req.body.studentId,
      teacherName: req.body.teacherName,
      studentName: req.body.studentName,
      course: req.body.course,
      time: req.body.time,
      duration: parseInt(req.body.duration) || 60,
      status: 'scheduled',
      participants: []
    });
    
    await meeting.save();
    console.log('✅ Meeting saved to Meeting collection:', meeting.meetingNumber);
    
    // ✅ FIXED: Calculate proper date for the schedule based on day
    const getScheduleDate = (day) => {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
      const dayMap = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
        'Sunday': 0
      };
      
      const targetDay = dayMap[day] || 1;
      let dateOffset = targetDay - currentDay;
      
      // If the day is earlier in the week, schedule for next week
      if (dateOffset <= 0) {
        dateOffset += 7;
      }
      
      const scheduleDate = new Date(today);
      scheduleDate.setDate(today.getDate() + dateOffset);
      scheduleDate.setHours(0, 0, 0, 0);
      
      return scheduleDate;
    };

    // Ensure required fields have fallbacks to prevent undefined data
    const scheduleData = {
      ...req.body,
      className: req.body.className || `${req.body.course || 'Quran'} Class`,
      meetingNumber: zoomMeeting.id.toString(), // ✅ REAL Zoom meeting ID
      joinUrl: zoomMeeting.join_url,
      startUrl: zoomMeeting.start_url,
      zoomMeetingId: zoomMeeting.id,
      date: getScheduleDate(req.body.day) // ✅ FIXED: Add proper date calculation
    };
    
    const schedule = new Schedule(scheduleData);
    const newSchedule = await schedule.save();
    console.log('✅ Schedule created with real meeting ID:', newSchedule.meetingNumber);
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error(' Schedule creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update schedule
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get schedules by day
const getSchedulesByDay = async (req, res) => {
  try {
    const schedules = await Schedule.find({ day: req.params.day })
      .populate('studentId', 'name')
      .populate('teacherId', 'name')
      .sort({ time: 1 });
    
    // ✅ FIXED: Return consistent response format
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get schedules by teacher
const getSchedulesByTeacher = async (req, res) => {
  try {
    // Prevent caching to ensure fresh data when meetings are created
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const schedules = await Schedule.find({ teacherId: req.params.teacherId })
      .populate('studentId', 'name')
      .sort({ day: 1, time: 1 });
    
    // ✅ FIXED: Return consistent response format
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request reschedule
const requestReschedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    schedule.rescheduleRequest = req.body;
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Approve/Reject reschedule
const handleReschedule = async (req, res) => {
  try {
    const { approved } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule || !schedule.rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }
    
    if (approved) {
      schedule.time = schedule.rescheduleRequest.newTime;
      schedule.day = schedule.rescheduleRequest.newDay;
      schedule.status = 'rescheduled';
      schedule.rescheduleRequest.status = 'approved';
    } else {
      schedule.rescheduleRequest.status = 'rejected';
    }
    
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get schedule statistics
const getScheduleStats = async (req, res) => {
  try {
    const total = await Schedule.countDocuments();
    const completed = await Schedule.countDocuments({ status: 'completed' });
    const scheduled = await Schedule.countDocuments({ status: 'scheduled' });
    const inProgress = await Schedule.countDocuments({ status: 'in_progress' });
    const cancelled = await Schedule.countDocuments({ status: 'cancelled' });
    
    const byDay = await Schedule.aggregate([
      {
        $group: {
          _id: '$day',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      total,
      completed,
      scheduled,
      inProgress,
      cancelled,
      byDay: byDay.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get schedules by student
const getSchedulesByStudent = async (req, res) => {
  try {
    // Prevent caching to ensure fresh data when meetings are created
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { studentId } = req.params;
    
    const schedules = await Schedule.find({
      studentId: studentId
    })
      .populate('studentId', 'name age')
      .populate('teacherId', 'name email')
      .sort({ day: 1, time: 1 });
    
    console.log('Student schedules found:', schedules.length, 'for student:', studentId);
    console.log('Schedules:', schedules.map(s => ({
      id: s._id,
      className: s.className,
      studentId: s.studentId,
      students: s.students
    })));
    
    // ✅ FIXED: Return consistent response format
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    res.status(500).json({ message: error.message });
  }
};

// Clean up fake meeting numbers (one-time cleanup)
const cleanupFakeMeetings = async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of fake meeting numbers...');
    
    // Remove fake meetingNumbers and related fields from all schedules
    const result = await Schedule.updateMany(
      { meetingNumber: { $regex: /^[a-zA-Z]/ } }, // Find schedules with non-numeric meetingNumbers
      { 
        $unset: { 
          meetingNumber: "", 
          joinUrl: "", 
          startUrl: "", 
          zoomMeetingId: "" 
        }
      }
    );
    
    console.log(`✅ Cleaned up ${result.modifiedCount} schedules with fake meeting numbers`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} schedules with fake meeting numbers`,
      cleaned: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSchedules,
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDay,
  getSchedulesByTeacher,
  getSchedulesByStudent,
  requestReschedule,
  handleReschedule,
  getScheduleStats,
  cleanupFakeMeetings
};
