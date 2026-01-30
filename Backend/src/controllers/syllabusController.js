const Syllabus = require('../models/Syllabus');

// Get all syllabi
exports.getSyllabi = async (req, res) => {
  try {
    const { course, level, status } = req.query;
    
    const filter = {};
    if (course) filter.course = course;
    if (level) filter.level = level;
    if (status) filter.status = status;
    
    const syllabi = await Syllabus.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const mappedSyllabi = syllabi.map(syllabus => ({
      ...syllabus.toObject(),
      id: syllabus._id.toString()
    }));
    
    res.json(mappedSyllabi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single syllabus by ID
exports.getSyllabusById = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id)
      .populate('createdBy', 'name email role');
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }
    
    const mappedSyllabus = {
      ...syllabus.toObject(),
      id: syllabus._id.toString()
    };
    
    res.json(mappedSyllabus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new syllabus
exports.createSyllabus = async (req, res) => {
  try {
    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          fileName: file.originalname,
          fileUrl: `/uploads/syllabi/${file.filename}`,
          fileType: file.mimetype
        });
      });
    }
    
    const {
      title,
      course,
      level,
      description,
      duration,
      topics,
      objectives,
      prerequisites,
      materials,
      assessmentCriteria,
      createdBy,
      createdByName,
      status
    } = req.body;
    
    // Validate required fields
    if (!title || !course || !level || !description || !duration || !createdBy || !createdByName) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, course, level, description, duration, createdBy, createdByName' 
      });
    }
    
    // Parse JSON arrays from FormData
    const parsedTopics = topics ? (typeof topics === 'string' ? JSON.parse(topics) : topics) : [];
    const parsedObjectives = objectives ? (typeof objectives === 'string' ? JSON.parse(objectives) : objectives) : [];
    const parsedPrerequisites = prerequisites ? (typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites) : [];
    const parsedMaterials = materials ? (typeof materials === 'string' ? JSON.parse(materials) : materials) : [];
    const parsedAssessmentCriteria = assessmentCriteria ? (typeof assessmentCriteria === 'string' ? JSON.parse(assessmentCriteria) : assessmentCriteria) : [];
    
    const syllabus = new Syllabus({
      title,
      course,
      level,
      description,
      duration,
      topics: parsedTopics,
      objectives: parsedObjectives,
      prerequisites: parsedPrerequisites,
      materials: parsedMaterials,
      assessmentCriteria: parsedAssessmentCriteria,
      attachments: attachments,
      createdBy,
      createdByName,
      status: status || 'active'
    });
    
    await syllabus.save();
    
    const mappedSyllabus = {
      ...syllabus.toObject(),
      id: syllabus._id.toString()
    };
    
    res.status(201).json(mappedSyllabus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const {
      title,
      course,
      level,
      description,
      duration,
      topics,
      objectives,
      prerequisites,
      materials,
      assessmentCriteria,
      status
    } = req.body;
    
    const syllabus = await Syllabus.findById(req.params.id);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }
    
    // Update fields
    if (title) syllabus.title = title;
    if (course) syllabus.course = course;
    if (level) syllabus.level = level;
    if (description) syllabus.description = description;
    if (duration) syllabus.duration = duration;
    if (topics) syllabus.topics = topics;
    if (objectives) syllabus.objectives = objectives;
    if (prerequisites) syllabus.prerequisites = prerequisites;
    if (materials) syllabus.materials = materials;
    if (assessmentCriteria) syllabus.assessmentCriteria = assessmentCriteria;
    if (status) syllabus.status = status;
    
    await syllabus.save();
    
    const mappedSyllabus = {
      ...syllabus.toObject(),
      id: syllabus._id.toString()
    };
    
    res.json(mappedSyllabus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }
    
    await Syllabus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get syllabus statistics
exports.getSyllabusStats = async (req, res) => {
  try {
    const total = await Syllabus.countDocuments();
    const active = await Syllabus.countDocuments({ status: 'active' });
    const draft = await Syllabus.countDocuments({ status: 'draft' });
    const archived = await Syllabus.countDocuments({ status: 'archived' });
    
    const byCourse = await Syllabus.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);
    
    const byLevel = await Syllabus.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    
    res.json({
      total,
      active,
      draft,
      archived,
      byCourse,
      byLevel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSyllabi: exports.getSyllabi,
  getSyllabusById: exports.getSyllabusById,
  createSyllabus: exports.createSyllabus,
  updateSyllabus: exports.updateSyllabus,
  deleteSyllabus: exports.deleteSyllabus,
  getSyllabusStats: exports.getSyllabusStats
};
