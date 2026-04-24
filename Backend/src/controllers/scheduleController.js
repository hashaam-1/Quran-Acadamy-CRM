const Schedule = require('../models/Schedule.js');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const schedules = await Schedule.find()
      .populate('studentId', 'name age')
      .populate('teacherId', 'name email')
      .sort({ day: 1, time: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single schedule
exports.getScheduleById = async (req, res) => {
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
exports.createSchedule = async (req, res) => {
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
    
    // Ensure required fields have fallbacks to prevent undefined data
    const scheduleData = {
      ...req.body,
      className: req.body.className || `${req.body.course || 'Quran'} Class`,
      meetingNumber: zoomMeeting.id.toString(), // ✅ REAL Zoom meeting ID
      joinUrl: zoomMeeting.join_url,
      startUrl: zoomMeeting.start_url,
      zoomMeetingId: zoomMeeting.id
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
exports.updateSchedule = async (req, res) => {
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
exports.deleteSchedule = async (req, res) => {
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
exports.getSchedulesByDay = async (req, res) => {
  try {
    const schedules = await Schedule.find({ day: req.params.day })
      .populate('studentId', 'name')
      .populate('teacherId', 'name')
      .sort({ time: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get schedules by teacher
exports.getSchedulesByTeacher = async (req, res) => {
  try {
    // Prevent caching to ensure fresh data when meetings are created
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const schedules = await Schedule.find({ teacherId: req.params.teacherId })
      .populate('studentId', 'name')
      .sort({ day: 1, time: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request reschedule
exports.requestReschedule = async (req, res) => {
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
exports.handleReschedule = async (req, res) => {
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
exports.getScheduleStats = async (req, res) => {
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
exports.getSchedulesByStudent = async (req, res) => {
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
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    res.status(500).json({ message: error.message });
  }
};
