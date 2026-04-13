const Meeting = require('../models/Meeting');
const crypto = require('crypto');
const axios = require('axios');

// Generate unique meeting number
const generateMeetingNumber = () => {
  // Generate a random 10-digit meeting number
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create Zoom meeting using Zoom API
const createZoomMeeting = async (meetingData) => {
  try {
    const { topic, startTime, duration, teacherEmail } = meetingData;
    
    const zoomApiUrl = 'https://api.zoom.us/v2/users/me/meetings';
    const headers = {
      'Authorization': `Bearer ${process.env.ZOOM_JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const payload = {
      topic,
      type: 1, // Scheduled meeting
      start_time: startTime,
      duration: duration || 60,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        cn_meeting: false,
        in_meeting: false,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0,
        audio: 'both',
        auto_recording: 'none'
      }
    };
    
    const response = await axios.post(zoomApiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw error;
  }
};

// Teacher starts a class
const startClass = async (req, res) => {
  console.log("START CLASS ENDPOINT HIT - Meeting controller working");
  console.log("Request body:", req.body);
  console.log("User:", req.user);
  
  try {
    const { scheduleId, className, course, startTime, endTime } = req.body;
    
    // For testing, use hardcoded user if no auth
    const teacherId = req.user?.id || 'test-teacher-id';
    const teacherName = req.user?.name || 'Test Teacher';
    
    // Check if meeting already exists for this schedule
    const existingMeeting = await Meeting.findOne({ 
      scheduleId, 
      status: { $in: ['scheduled', 'live'] }
    });
    
    if (existingMeeting) {
      return res.status(400).json({ 
        error: 'Meeting already exists for this class',
        meeting: existingMeeting
      });
    }
    
    // Generate meeting data
    const meetingNumber = generateMeetingNumber();
    const meetingDate = new Date();
    
    // Create Zoom meeting (if you have Zoom API access)
    let zoomMeetingId = meetingNumber;
    try {
      const zoomMeeting = await createZoomMeeting({
        topic: `${className} - ${course}`,
        startTime: meetingDate.toISOString(),
        duration: 60,
        teacherEmail: req.user.email
      });
      zoomMeetingId = zoomMeeting.id.toString();
    } catch (zoomError) {
      console.log('Zoom API not available, using local meeting number');
    }
    
    // Create meeting record
    const meeting = new Meeting({
      className,
      meetingNumber,
      password: '',
      teacherId,
      teacherName,
      scheduleId,
      date: meetingDate,
      startTime,
      endTime,
      status: 'live',
      course,
      zoomMeetingId,
      participants: [{
        userId: teacherId,
        name: teacherName,
        role: 1, // Host
        joinTime: new Date()
      }]
    });
    
    await meeting.save();
    
    res.status(201).json({
      success: true,
      meeting,
      message: 'Class started successfully'
    });
    
  } catch (error) {
    console.error('Error starting class:', error);
    res.status(500).json({ error: 'Failed to start class' });
  }
};

// Student joins a class
const joinClass = async (req, res) => {
  try {
    const { meetingNumber } = req.params;
    const studentId = req.user.id;
    const studentName = req.user.name;
    
    // Find the meeting
    const meeting = await Meeting.findOne({ 
      meetingNumber,
      status: { $in: ['scheduled', 'live'] }
    }).populate('teacherId studentIds scheduleId');
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found or not active' });
    }
    
    // Check if student is enrolled
    if (meeting.studentIds.length > 0) {
      const isEnrolled = meeting.studentIds.some(id => 
        id.toString() === studentId
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Student not enrolled in this class' });
      }
    }
    
    // Add student to participants if not already there
    const existingParticipant = meeting.participants.find(
      p => p.userId.toString() === studentId
    );
    
    if (!existingParticipant) {
      meeting.participants.push({
        userId: studentId,
        name: studentName,
        role: 0, // Participant
        joinTime: new Date()
      });
      await meeting.save();
    }
    
    res.status(200).json({
      success: true,
      meeting: {
        meetingNumber: meeting.meetingNumber,
        className: meeting.className,
        teacherName: meeting.teacherName,
        course: meeting.course,
        status: meeting.status,
        zoomMeetingId: meeting.zoomMeetingId
      },
      message: 'Joined class successfully'
    });
    
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
};

// Get active meetings for a teacher
const getTeacherMeetings = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const meetings = await Meeting.find({ 
      teacherId,
      status: { $in: ['scheduled', 'live'] }
    }).populate('studentIds scheduleId').sort({ date: -1 });
    
    res.status(200).json({ meetings });
  } catch (error) {
    console.error('Error getting teacher meetings:', error);
    res.status(500).json({ error: 'Failed to get meetings' });
  }
};

// Get meetings for a student
const getStudentMeetings = async (req, res) => {
  try {
    const studentId = req.user.id;
    const meetings = await Meeting.find({ 
      studentIds: studentId,
      status: { $in: ['scheduled', 'live'] }
    }).populate('teacherId scheduleId').sort({ date: -1 });
    
    res.status(200).json({ meetings });
  } catch (error) {
    console.error('Error getting student meetings:', error);
    res.status(500).json({ error: 'Failed to get meetings' });
  }
};

// End a class (teacher only)
const endClass = async (req, res) => {
  try {
    const { meetingNumber } = req.params;
    const teacherId = req.user.id;
    
    const meeting = await Meeting.findOne({ 
      meetingNumber,
      teacherId,
      status: 'live'
    });
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found or not active' });
    }
    
    meeting.status = 'ended';
    meeting.endTime = new Date().toLocaleTimeString();
    
    // Update leave time for all participants
    meeting.participants.forEach(participant => {
      if (!participant.leaveTime) {
        participant.leaveTime = new Date();
      }
    });
    
    await meeting.save();
    
    res.status(200).json({
      success: true,
      message: 'Class ended successfully'
    });
    
  } catch (error) {
    console.error('Error ending class:', error);
    res.status(500).json({ error: 'Failed to end class' });
  }
};

// Get meeting details
const getMeetingDetails = async (req, res) => {
  try {
    const { meetingNumber } = req.params;
    
    const meeting = await Meeting.findOne({ meetingNumber })
      .populate('teacherId studentIds scheduleId participants.userId');
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.status(200).json({ meeting });
  } catch (error) {
    console.error('Error getting meeting details:', error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
};

module.exports = {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails,
  generateMeetingNumber
};
