const TeamMember = require('../models/TeamMember.js');
const { sendEmail, emailTemplates } = require('../config/email.js');
const { generatePassword, generateUserId } = require('../utils/passwordGenerator.js');
const bcrypt = require('bcryptjs');

// Get all team members
exports.getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single team member
exports.getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create team member with email notification
exports.createTeamMember = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    
    console.log('Creating team member with data:', { name, email, role, passwordProvided: !!password, providedPassword: password });
    
    // Use email as userId for login
    const userId = email;
    
    // Always auto-generate password for security
    const autoPassword = generatePassword(12);
    
    console.log('Using auto-generated password:', autoPassword);
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(autoPassword, 10);
    
    console.log('Hashed password created, length:', hashedPassword.length);
    
    // Create team member with generated credentials
    const member = new TeamMember({
      ...req.body,
      userId,
      password: hashedPassword,
      plainPassword: autoPassword, // Store auto-generated password for admin viewing
      passwordChanged: false,
    });
    
    const newMember = await member.save();
    
    console.log('Team member saved:', { 
      id: newMember._id, 
      name: newMember.name, 
      email: newMember.email,
      plainPassword: newMember.plainPassword,
      hasHashedPassword: !!newMember.password 
    });
    
    // Send welcome email with credentials
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const emailTemplate = emailTemplates.teamMemberCredentials({
      name,
      email,
      password: autoPassword, // Include auto-generated password
      role: role.replace('_', ' ').toUpperCase(),
      loginUrl,
    });
    
    const emailResult = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    
    // Return response with plain password for frontend to display
    const memberResponse = newMember.toObject();
    delete memberResponse.password; // Remove hashed password
    
    console.log('Sending response with password:', autoPassword);
    
    res.status(201).json({
      ...memberResponse,
      plainPassword: autoPassword, // Send plain password for display
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Team member created and credentials sent via email' 
        : 'Team member created but email failed to send',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update team member
exports.updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete team member
exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend credentials to team member
exports.resendCredentials = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Send email with credentials (password is hashed, so we can't retrieve it)
    // In production, you'd generate a reset link instead
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const emailTemplate = emailTemplates.teamMemberCredentials({
      name: member.name,
      email: member.email,
      password: '(Use password reset if forgotten)',
      role: member.role.replace('_', ' ').toUpperCase(),
      loginUrl,
    });
    
    const emailResult = await sendEmail({
      to: member.email,
      subject: 'Your Login Credentials - Quran Academy CRM',
      html: emailTemplate.html,
    });
    
    res.json({
      success: emailResult.success,
      message: emailResult.success 
        ? 'Credentials sent successfully' 
        : 'Failed to send credentials',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Team member login
exports.teamMemberLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Team member login attempt:', { email, passwordProvided: !!password });
    
    // Find team member by email
    const member = await TeamMember.findOne({ email });
    
    if (!member) {
      console.log('Team member not found:', email);
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    console.log('Team member found:', { 
      name: member.name, 
      email: member.email, 
      hasPlainPassword: !!member.plainPassword,
      plainPassword: member.plainPassword,
      hasHashedPassword: !!member.password 
    });
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, member.password);
    
    console.log('Password comparison result:', { 
      providedPassword: password, 
      isValid: isPasswordValid,
      storedPlainPassword: member.plainPassword 
    });
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Return team member data without password
    const memberData = {
      _id: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      status: member.status,
      performance: member.performance,
      rating: member.rating,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
    
    res.json(memberData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team statistics
exports.getTeamStats = async (req, res) => {
  try {
    const total = await TeamMember.countDocuments();
    const active = await TeamMember.countDocuments({ status: 'active' });
    const inactive = await TeamMember.countDocuments({ status: 'inactive' });
    
    const byRole = await TeamMember.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const avgPerformance = await TeamMember.aggregate([
      {
        $group: {
          _id: null,
          avgPerformance: { $avg: '$performance' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    res.json({
      total,
      active,
      inactive,
      byRole: byRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      avgPerformance: avgPerformance[0]?.avgPerformance || 0,
      avgRating: avgPerformance[0]?.avgRating || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
