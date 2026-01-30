const Schedule = require('../models/Schedule.js');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
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
module.exports. getScheduleById = async (req, res) => {
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
module.exports. createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update schedule
module.exports. updateSchedule = async (req, res) => {
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
module.exports. deleteSchedule = async (req, res) => {
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
module.exports. getSchedulesByDay = async (req, res) => {
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
module.exports. getSchedulesByTeacher = async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.params.teacherId })
      .populate('studentId', 'name')
      .sort({ day: 1, time: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request reschedule
module.exports. requestReschedule = async (req, res) => {
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
module.exports. handleReschedule = async (req, res) => {
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
module.exports. getScheduleStats = async (req, res) => {
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
