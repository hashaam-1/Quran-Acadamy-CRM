const Syllabus = require('../models/Syllabus');
const { uploadToCloudinary } = require('../middleware/upload');

// Get all syllabi
exports.getSyllabi = async (req, res) => {
  console.log('🔍 GET SYLLABI: Function called');
  console.log('🔍 GET SYLLABI: Query params:', req.query);
  console.log('🔍 GET SYLLABI: Request headers:', req.headers);
  
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
    // Handle file uploads with direct Cloudinary upload
    const attachments = [];
    console.log('📤 Files received in request:', req.files ? req.files.length : 0);
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('📄 Processing file for direct Cloudinary upload:', {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
        
        try {
          // Upload directly to Cloudinary with resource_type: "raw"
          const uploadResult = await uploadToCloudinary(file);
          
          console.log('✅ File uploaded successfully:', {
            fileName: file.originalname,
            secure_url: uploadResult.secure_url,
            resource_type: uploadResult.resource_type
          });
          
          // Use the correct Cloudinary URL from direct upload
          attachments.push({
            fileName: file.originalname,
            fileUrl: uploadResult.secure_url, // Direct Cloudinary URL with /raw/upload/
            fileType: file.mimetype
          });
        } catch (uploadError) {
          console.error('❌ Failed to upload file:', file.originalname, uploadError);
          // Continue with other files, but log the error
        }
      }
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
    
    // Parse JSON arrays from FormData with error handling
    let parsedTopics = [];
    let parsedObjectives = [];
    let parsedPrerequisites = [];
    let parsedMaterials = [];
    let parsedAssessmentCriteria = [];
    
    try {
      parsedTopics = topics ? (typeof topics === 'string' ? JSON.parse(topics) : topics) : [];
    } catch (error) {
      console.error('Error parsing topics JSON:', error);
      parsedTopics = [];
    }
    
    try {
      parsedObjectives = objectives ? (typeof objectives === 'string' ? JSON.parse(objectives) : objectives) : [];
    } catch (error) {
      console.error('Error parsing objectives JSON:', error);
      parsedObjectives = [];
    }
    
    try {
      parsedPrerequisites = prerequisites ? (typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites) : [];
    } catch (error) {
      console.error('Error parsing prerequisites JSON:', error);
      parsedPrerequisites = [];
    }
    
    try {
      parsedMaterials = materials ? (typeof materials === 'string' ? JSON.parse(materials) : materials) : [];
    } catch (error) {
      console.error('Error parsing materials JSON:', error);
      parsedMaterials = [];
    }
    
    try {
      parsedAssessmentCriteria = assessmentCriteria ? (typeof assessmentCriteria === 'string' ? JSON.parse(assessmentCriteria) : assessmentCriteria) : [];
    } catch (error) {
      console.error('Error parsing assessmentCriteria JSON:', error);
      parsedAssessmentCriteria = [];
    }
    
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
    
    // Parse JSON arrays from FormData with error handling
    let parsedTopics = topics;
    let parsedObjectives = objectives;
    let parsedPrerequisites = prerequisites;
    let parsedMaterials = materials;
    let parsedAssessmentCriteria = assessmentCriteria;
    
    try {
      parsedTopics = topics ? (typeof topics === 'string' ? JSON.parse(topics) : topics) : topics;
    } catch (error) {
      console.error('Error parsing topics JSON in update:', error);
      parsedTopics = topics;
    }
    
    try {
      parsedObjectives = objectives ? (typeof objectives === 'string' ? JSON.parse(objectives) : objectives) : objectives;
    } catch (error) {
      console.error('Error parsing objectives JSON in update:', error);
      parsedObjectives = objectives;
    }
    
    try {
      parsedPrerequisites = prerequisites ? (typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites) : prerequisites;
    } catch (error) {
      console.error('Error parsing prerequisites JSON in update:', error);
      parsedPrerequisites = prerequisites;
    }
    
    try {
      parsedMaterials = materials ? (typeof materials === 'string' ? JSON.parse(materials) : materials) : materials;
    } catch (error) {
      console.error('Error parsing materials JSON in update:', error);
      parsedMaterials = materials;
    }
    
    try {
      parsedAssessmentCriteria = assessmentCriteria ? (typeof assessmentCriteria === 'string' ? JSON.parse(assessmentCriteria) : assessmentCriteria) : assessmentCriteria;
    } catch (error) {
      console.error('Error parsing assessmentCriteria JSON in update:', error);
      parsedAssessmentCriteria = assessmentCriteria;
    }
    
    // Handle file uploads with direct Cloudinary for updates
    if (req.files && req.files.length > 0) {
      const attachments = [];
      console.log('📤 Files received in update request:', req.files.length);
      for (const file of req.files) {
        console.log('📄 Processing file for direct Cloudinary upload (update):', {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
        
        try {
          // Upload directly to Cloudinary with resource_type: "raw"
          const uploadResult = await uploadToCloudinary(file);
          
          console.log('✅ File uploaded successfully in update:', {
            fileName: file.originalname,
            secure_url: uploadResult.secure_url,
            resource_type: uploadResult.resource_type
          });
          
          // Use the correct Cloudinary URL from direct upload
          attachments.push({
            fileName: file.originalname,
            fileUrl: uploadResult.secure_url, // Direct Cloudinary URL with /raw/upload/
            fileType: file.mimetype
          });
        } catch (uploadError) {
          console.error('❌ Failed to upload file in update:', file.originalname, uploadError);
          // Continue with other files, but log the error
        }
      }
      
      // Add new attachments to existing ones or replace them
      syllabus.attachments = [...(syllabus.attachments || []), ...attachments];
    }
    
    // Update fields
    if (title) syllabus.title = title;
    if (course) syllabus.course = course;
    if (level) syllabus.level = level;
    if (description) syllabus.description = description;
    if (duration) syllabus.duration = duration;
    if (parsedTopics) syllabus.topics = parsedTopics;
    if (parsedObjectives) syllabus.objectives = parsedObjectives;
    if (parsedPrerequisites) syllabus.prerequisites = parsedPrerequisites;
    if (parsedMaterials) syllabus.materials = parsedMaterials;
    if (parsedAssessmentCriteria) syllabus.assessmentCriteria = parsedAssessmentCriteria;
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
