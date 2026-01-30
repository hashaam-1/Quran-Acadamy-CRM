const Homework = require('../models/Homework.js');

// Get all homework
exports.getAllHomework = async (req, res) => {
  try {
    const homework = await Homework.find()
      .populate('studentId', 'name course')
      .populate('teacherId', 'name')
      .sort({ dueDate: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get homework by ID
exports.getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('studentId', 'name course')
      .populate('teacherId', 'name');
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get homework by student
exports.getHomeworkByStudent = async (req, res) => {
  try {
    const homework = await Homework.find({ studentId: req.params.studentId })
      .populate('teacherId', 'name')
      .sort({ dueDate: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get homework by teacher
exports.getHomeworkByTeacher = async (req, res) => {
  try {
    const homework = await Homework.find({ teacherId: req.params.teacherId })
      .populate('studentId', 'name course')
      .sort({ dueDate: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create homework
exports.createHomework = async (req, res) => {
  try {
    const homework = new Homework(req.body);
    const newHomework = await homework.save();
    res.status(201).json(newHomework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update homework
exports.updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    res.json(homework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Submit homework (student)
exports.submitHomework = async (req, res) => {
  try {
    const { submissionNotes } = req.body;
    const homework = await Homework.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        submittedDate: new Date(),
        submissionNotes
      },
      { new: true }
    );
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    res.json(homework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Grade homework (teacher)
exports.gradeHomework = async (req, res) => {
  try {
    const { grade, teacherFeedback } = req.body;
    const homework = await Homework.findByIdAndUpdate(
      req.params.id,
      { grade, teacherFeedback },
      { new: true }
    );
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    res.json(homework);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete homework
exports.deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get homework statistics
exports.getHomeworkStats = async (req, res) => {
  try {
    const stats = await Homework.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const byCourse = await Homework.aggregate([
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({ stats, byCourse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
