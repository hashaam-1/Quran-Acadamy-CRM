const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    enum: ['Qaida', 'Nazra', 'Hifz', 'Tajweed']
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  topics: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    duration: String,
    order: Number
  }],
  objectives: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  materials: [{
    type: String
  }],
  assessmentCriteria: [{
    type: String
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMember',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
syllabusSchema.index({ course: 1 });
syllabusSchema.index({ level: 1 });
syllabusSchema.index({ status: 1 });
syllabusSchema.index({ createdBy: 1 });

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

module.exports = Syllabus;
