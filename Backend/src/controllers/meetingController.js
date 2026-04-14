const Meeting = require("../models/Meeting");
const Schedule = require("../models/Schedule");

let axios = null;
try {
  axios = require("axios");
} catch (err) {
  console.log("Axios not installed - Zoom disabled");
}

/* =====================
   GENERATE MEETING ID
===================== */
const generateMeetingNumber = () => {
  return Date.now().toString().slice(-10);
};

/* =====================
   ZOOM (SERVER-TO-SERVER OAUTH)
===================== */
const getZoomAccessToken = async () => {
  try {
    if (!axios) return null;

    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const accountId = process.env.ZOOM_ACCOUNT_ID;

    if (!clientId || !clientSecret || !accountId) {
      console.log("Missing Zoom OAuth credentials");
      return null;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  } catch (err) {
    console.log("Zoom OAuth Error:", err.message);
    return null;
  }
};

const createZoomMeeting = async ({ topic, startTime, duration = 60 }) => {
  try {
    if (!axios) return null;

    const accessToken = await getZoomAccessToken();
    if (!accessToken) {
      console.log("Failed to get Zoom access token");
      return null;
    }

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 1, // Scheduled meeting
        start_time: startTime,
        duration: duration,
        settings: {
          join_before_host: true,
          participant_video: true,
          host_video: true,
          mute_upon_entry: false,
          waiting_room: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Zoom meeting created successfully:", response.data.id);
    return response.data;
  } catch (err) {
    console.log("Zoom Meeting Creation Error:", err.response?.data || err.message);
    return null;
  }
};

/* =====================
   START CLASS (FIXED)
===================== */
const startClass = async (req, res) => {
  try {
    const { className, course, scheduleId } = req.body;

    // SAFE USER HANDLING (IMPORTANT FIX)
    const teacherId = req.user?.id || "guest";
    const teacherName = req.user?.name || "Guest";

    // Check for existing live meeting (SMART RECOVERY LOGIC)
    let existing = null;
    try {
      existing = await Meeting.findOne({
        scheduleId,
        status: { $in: ["live"] },
      });
    } catch (dbErr) {
      console.log("DB query error:", dbErr.message);
    }

    // Auto-expire abandoned meetings (2+ hours old)
    const twoHours = 2 * 60 * 60 * 1000;
    if (
      existing &&
      existing.status === "live" &&
      Date.now() - new Date(existing.createdAt).getTime() > twoHours
    ) {
      console.log("Meeting expired - marking as expired");
      existing.status = "expired";
      await existing.save();
      existing = null; // Allow new meeting creation
    }

    // If meeting exists and is live, return it for rejoining
    if (existing) {
      console.log("Rejoining existing live meeting:", existing.meetingNumber);
      return res.json({
        success: true,
        message: "Rejoining existing class",
        meeting: existing,
        rejoin: true,
      });
    }

    // REQUIRE REAL ZOOM MEETING
    let zoom;
    try {
      console.log("CREATING ZOOM MEETING:", {
        topic: `${className} - ${course}`,
        startTime: new Date().toISOString(),
        className,
        course,
        scheduleId
      });
      
      zoom = await createZoomMeeting({
        topic: `${className} - ${course}`,
        startTime: new Date().toISOString()
      });
      
      console.log("ZOOM MEETING CREATION RESULT:", zoom);
    } catch (zErr) {
      console.error("Zoom meeting creation failed:", zErr.message);
      console.error("Zoom Error Details:", zErr.response?.data || zErr);
      return res.status(500).json({
        success: false,
        message: "Failed to create Zoom meeting. Please check Zoom credentials.",
        error: zErr.message,
        details: zErr.response?.data
      });
    }

    // Validate Zoom meeting creation
    if (!zoom || !zoom.id) {
      console.error("INVALID ZOOM RESPONSE:", zoom);
      return res.status(500).json({
        success: false,
        message: "Zoom meeting creation failed - no meeting ID returned",
        zoomResponse: zoom
      });
    }

    let meeting;

    try {
      meeting = await Meeting.create({
        className,
        course,
        scheduleId,
        teacherId,
        teacherName,
        meetingNumber: zoom.id, // Use real Zoom meeting ID
        status: "live",
        zoomMeetingId: zoom.id, // Use real Zoom meeting ID
        zoomPassword: zoom.password || "",
        zoomJoinUrl: zoom.join_url,
        zoomStartUrl: zoom.start_url,
        participants: [
          {
            userId: teacherId,
            name: teacherName,
            role: 1,
          },
        ],
      });
    } catch (createErr) {
      console.error("Meeting create error:", createErr.message);

      return res.status(500).json({
        success: false,
        message: "Database error creating meeting",
        error: createErr.message,
      });
    }

    return res.json({
      success: true,
      meeting,
    });
  } catch (err) {
    console.error("START CLASS CRASH:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to start class",
    });
  }
};

/* =====================
   JOIN CLASS (SAFE)
===================== */
const joinClass = async (req, res) => {
  try {
    const { meetingNumber } = req.params;

    const meeting = await Meeting.findOne({ meetingNumber });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const userId = req.user?.id || "guest";
    const userName = req.user?.name || "Guest";

    const already = meeting.participants.find(
      (p) => String(p.userId) === String(userId)
    );

    if (!already) {
      meeting.participants.push({
        userId,
        name: userName,
        role: 0,
      });

      await meeting.save();
    }

    res.json({
      success: true,
      meeting,
    });
  } catch (err) {
    console.log("JOIN ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Join failed",
    });
  }
};

/* =====================
   OTHER APIs (UNCHANGED BUT SAFE)
===================== */
const getTeacherMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      teacherId: req.user?.id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const getStudentMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      "participants.userId": req.user?.id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const endClass = async (req, res) => {
  try {
    await Meeting.updateOne(
      { meetingNumber: req.params.meetingNumber },
      { status: "ended" }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

const createScheduledMeeting = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    // Check if meeting already exists
    if (schedule.meetingStatus === 'created' || schedule.meetingStatus === 'started') {
      return res.status(400).json({
        success: false,
        message: "Meeting already created for this schedule"
      });
    }

    // Create Zoom meeting
    let zoom;
    try {
      const meetingDateTime = new Date();
      const [hours, minutes] = schedule.time.split(':');
      meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      zoom = await createZoomMeeting({
        topic: `${schedule.course} - ${schedule.studentName}`,
        startTime: meetingDateTime.toISOString(),
        duration: parseInt(schedule.duration) || 60
      });
    } catch (zErr) {
      console.error("Zoom meeting creation failed:", zErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create Zoom meeting. Please check Zoom credentials.",
        error: zErr.message,
      });
    }

    // Validate Zoom meeting creation
    if (!zoom || !zoom.id) {
      return res.status(500).json({
        success: false,
        message: "Zoom meeting creation failed - no meeting ID returned",
      });
    }

    // Update schedule with Zoom meeting details
    schedule.zoomMeetingId = zoom.id;
    schedule.zoomPassword = zoom.password || "";
    schedule.zoomJoinUrl = zoom.join_url;
    schedule.zoomStartUrl = zoom.start_url;
    schedule.meetingStatus = 'created';
    
    await schedule.save();

    res.json({
      success: true,
      schedule,
      zoomMeeting: {
        meetingId: zoom.id,
        password: zoom.password,
        joinUrl: zoom.join_url,
        startUrl: zoom.start_url
      }
    });

  } catch (err) {
    console.error("CREATE SCHEDULED MEETING ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create scheduled meeting"
    });
  }
};

const getMeetingDetails = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingNumber: req.params.meetingNumber,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    // Check if this is a real Zoom meeting
    const isRealZoomMeeting = meeting.zoomMeetingId && 
      meeting.zoomMeetingId !== meeting.meetingNumber &&
      meeting.zoomMeetingId.length > 10;

    res.json({
      success: true,
      meeting,
      isRealZoomMeeting,
      debug: {
        meetingNumber: meeting.meetingNumber,
        zoomMeetingId: meeting.zoomMeetingId,
        hasZoomPassword: !!meeting.zoomPassword,
        hasZoomJoinUrl: !!meeting.zoomJoinUrl,
        hasZoomStartUrl: !!meeting.zoomStartUrl
      }
    });
  } catch (err) {
    console.error("Get meeting details error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

module.exports = {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails,
  createScheduledMeeting,
};