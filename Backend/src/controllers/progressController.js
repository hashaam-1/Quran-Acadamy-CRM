const Progress = require('../models/Progress.js');
const Student = require('../models/Student.js');

// Get all progress records
exports.getProgressRecords = async (req, res) => {
  try {
    const records = await Progress.find()
      .populate('studentId', 'name age course teacher teacherId')
      .populate('teacherId', 'name email')
      .sort({ date: -1 });
    
    // Ensure student and teacher names are set
    const mappedRecords = records.map(record => {
      const obj = record.toObject();
      if (obj.studentId && !obj.studentName) {
        obj.studentName = obj.studentId.name;
      }
      if (obj.teacherId && !obj.teacherName) {
        obj.teacherName = obj.teacherId.name;
      }
      return obj;
    });
    
    res.json(mappedRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single progress record
module.exports.getProgressById = async (req, res) => {
  try {
    const record = await Progress.findById(req.params.id)
      .populate('studentId', 'name age course teacher')
      .populate('teacherId', 'name email');
    if (!record) {
      return res.status(404).json({ message: 'Progress record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create progress record
module.exports.createProgress = async (req, res) => {
  try {
    const { studentId, completion } = req.body;
    
    // Create new record (allow multiple progress records per student)
    const record = new Progress(req.body);
    await record.save();
    
    // Populate the record before returning
    await record.populate('studentId', 'name age course teacher');
    await record.populate('teacherId', 'name email');
    
    // Update student's overall progress field to latest completion
    if (studentId && completion !== undefined) {
      await Student.findByIdAndUpdate(
        studentId,
        { progress: completion },
        { new: true }
      );
    }
    
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating progress:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update progress record
module.exports.updateProgress = async (req, res) => {
  try {
    const { studentId, completion } = req.body;
    
    const record = await Progress.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name age course teacher')
      .populate('teacherId', 'name email');
    
    if (!record) {
      return res.status(404).json({ message: 'Progress record not found' });
    }
    
    // Update student's overall progress field
    if (studentId && completion !== undefined) {
      await Student.findByIdAndUpdate(
        studentId,
        { progress: completion },
        { new: true }
      );
    }
    
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete progress record
module.exports.deleteProgress = async (req, res) => {
  try {
    const record = await Progress.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Progress record not found' });
    }
    res.json({ message: 'Progress record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get progress by student
module.exports.getProgressByStudent = async (req, res) => {
  try {
    const records = await Progress.find({ studentId: req.params.studentId })
      .populate('studentId', 'name age course teacher')
      .populate('teacherId', 'name email')
      .sort({ date: -1 });
    
    // Ensure student and teacher names are set
    const mappedRecords = records.map(record => {
      const obj = record.toObject();
      if (obj.studentId && !obj.studentName) {
        obj.studentName = obj.studentId.name;
      }
      if (obj.teacherId && !obj.teacherName) {
        obj.teacherName = obj.teacherId.name;
      }
      return obj;
    });
    
    res.json(mappedRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get latest progress for all students
module.exports.getLatestProgress = async (req, res) => {
  try {
    const latestRecords = await Progress.aggregate([
      { $sort: { studentId: 1, date: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestRecord: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestRecord' }
      }
    ]);
    
    res.json(latestRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get progress statistics
module.exports.getProgressStats = async (req, res) => {
  try {
    const avgCompletion = await Progress.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completion' }
        }
      }
    ]);
    
    const byCourse = await Progress.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.course',
          avgCompletion: { $avg: '$completion' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      avgCompletion: avgCompletion[0]?.avgCompletion || 0,
      byCourse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
