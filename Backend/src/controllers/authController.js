const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const TeamMember = require('../models/TeamMember');
const bcrypt = require('bcryptjs');

// ✅ UNIFIED LOGIN - Single endpoint for all roles
const unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ✅ FIXED: Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔐 Unified login attempt:', normalizedEmail);
    console.log('🔐 Password provided:', password ? 'YES' : 'NO');
    console.log('🔐 Request body:', JSON.stringify(req.body));
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // ✅ FIXED: Try admin first (special case)
    if (normalizedEmail === 'hashaamamz1@gmail.com' && password === 'hashaam@123') {
      const adminUser = {
        _id: '1',
        id: '1',
        name: 'Admin',
        email: 'hashaamamz1@gmail.com',
        phone: '+92300111222',
        role: 'admin',
        createdAt: '2023-01-01'
      };
      
      console.log('✅ Admin login successful');
      return res.json({
        success: true,
        user: adminUser,
        message: 'Admin login successful'
      });
    }
    
    // ✅ FIXED: Check student role with normalized email
    console.log('🔍 Looking for student with email:', normalizedEmail);
    const student = await Student.findOne({ email: normalizedEmail });
    console.log('🔍 Student found:', !!student);
    if (student) {
      console.log('🔍 Student details:', {
        name: student.name,
        email: student.email,
        hasPassword: !!student.password,
        hasPlainPassword: !!student.plainPassword,
        passwordLength: student.password ? student.password.length : 0,
        plainPasswordLength: student.plainPassword ? student.plainPassword.length : 0
      });
      
      console.log('🔍 Comparing passwords for student:', student.name);
      let isPasswordMatch = false;
      
      // ✅ FIXED: Try bcrypt first, then plain text fallback
      try {
        isPasswordMatch = await bcrypt.compare(password, student.password);
        console.log('🔍 Bcrypt password match result:', isPasswordMatch);
      } catch (error) {
        console.log('🔍 Bcrypt failed, trying plain text comparison');
        console.log('🔍 Bcrypt error:', error.message);
        isPasswordMatch = password === student.plainPassword || password === student.password;
        console.log('🔍 Plain text password match result:', isPasswordMatch);
        console.log('🔍 Password comparison:', {
          inputPassword: password,
          plainPassword: student.plainPassword,
          directPassword: student.password,
          plainMatch: password === student.plainPassword,
          directMatch: password === student.password
        });
      }
      
      if (isPasswordMatch) {
        const user = {
          _id: student._id,
          id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone || '',
          role: 'student',
          createdAt: student.createdAt,
          studentId: student._id
        };
        
        console.log('✅ Student login successful');
        return res.json({
          success: true,
          user: user,
          message: 'Student login successful'
        });
      }
    }
    
    // ✅ FIXED: Check teacher role with normalized email
    console.log('🔍 Looking for teacher with email:', normalizedEmail);
    const teacher = await Teacher.findOne({ email: normalizedEmail });
    console.log('🔍 Teacher found:', !!teacher);
    if (teacher) {
      console.log('🔍 Teacher details:', {
        name: teacher.name,
        email: teacher.email,
        hasPassword: !!teacher.password,
        hasPlainPassword: !!teacher.plainPassword,
        passwordLength: teacher.password ? teacher.password.length : 0,
        plainPasswordLength: teacher.plainPassword ? teacher.plainPassword.length : 0
      });
      
      console.log('🔍 Comparing passwords for teacher:', teacher.name);
      let isPasswordMatch = false;
      
      // ✅ FIXED: Try bcrypt first, then plain text fallback
      try {
        isPasswordMatch = await bcrypt.compare(password, teacher.password);
        console.log('🔍 Bcrypt password match result:', isPasswordMatch);
      } catch (error) {
        console.log('🔍 Bcrypt failed, trying plain text comparison');
        console.log('🔍 Bcrypt error:', error.message);
        isPasswordMatch = password === teacher.plainPassword || password === teacher.password;
        console.log('🔍 Plain text password match result:', isPasswordMatch);
        console.log('🔍 Password comparison:', {
          inputPassword: password,
          plainPassword: teacher.plainPassword,
          directPassword: teacher.password,
          plainMatch: password === teacher.plainPassword,
          directMatch: password === teacher.password
        });
      }
      
      if (isPasswordMatch) {
        const user = {
          _id: teacher._id,
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || '',
          role: 'teacher',
          createdAt: teacher.createdAt,
          teacherId: teacher._id
        };
        
        console.log('✅ Teacher login successful');
        return res.json({
          success: true,
          user: user,
          message: 'Teacher login successful'
        });
      }
    }
    
    // ✅ FIXED: Check team member role with normalized email
    console.log('🔍 Looking for team member with email:', normalizedEmail);
    const teamMember = await TeamMember.findOne({ email: normalizedEmail });
    console.log('🔍 Team member found:', !!teamMember);
    if (teamMember) {
      console.log('🔍 Team member details:', {
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        hasPassword: !!teamMember.password,
        hasPlainPassword: !!teamMember.plainPassword,
        passwordLength: teamMember.password ? teamMember.password.length : 0,
        plainPasswordLength: teamMember.plainPassword ? teamMember.plainPassword.length : 0
      });
      
      console.log('🔍 Comparing passwords for team member:', teamMember.name);
      let isPasswordMatch = false;
      
      // ✅ FIXED: Try bcrypt first, then plain text fallback
      try {
        isPasswordMatch = await bcrypt.compare(password, teamMember.password);
        console.log('🔍 Bcrypt password match result:', isPasswordMatch);
      } catch (error) {
        console.log('🔍 Bcrypt failed, trying plain text comparison');
        console.log('🔍 Bcrypt error:', error.message);
        isPasswordMatch = password === teamMember.plainPassword || password === teamMember.password;
        console.log('🔍 Plain text password match result:', isPasswordMatch);
        console.log('🔍 Password comparison:', {
          inputPassword: password,
          plainPassword: teamMember.plainPassword,
          directPassword: teamMember.password,
          plainMatch: password === teamMember.plainPassword,
          directMatch: password === teamMember.password
        });
      }
      
      if (isPasswordMatch) {
        const user = {
          _id: teamMember._id,
          id: teamMember._id,
          name: teamMember.name,
          email: teamMember.email,
          phone: teamMember.phone || '',
          role: teamMember.role, // sales_team or team_leader
          createdAt: teamMember.createdAt
        };
        
        console.log('✅ Team member login successful');
        return res.json({
          success: true,
          user: user,
          message: 'Team member login successful'
        });
      }
    }
    
    // ✅ FIXED: No user found
    console.log('❌ Login failed: Invalid credentials');
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
    
  } catch (error) {
    console.error('❌ Unified login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ✅ FIXED: Proper module.exports
module.exports = {
  unifiedLogin
};
