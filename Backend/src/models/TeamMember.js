const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  plainPassword: {
    type: String,
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['sales_team', 'team_leader']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  leadsConverted: {
    type: Number,
    default: 0
  },
  teachersManaged: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  performance: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  targetProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

teamMemberSchema.index({ role: 1 });
teamMemberSchema.index({ status: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
