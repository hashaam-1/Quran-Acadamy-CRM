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
   ZOOM (SAFE)
===================== */
const createZoomMeeting = async ({ topic, startTime }) => {
  try {
    if (!axios || !process.env.ZOOM_JWT_TOKEN) return null;

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 1,
        start_time: startTime,
        duration: 60,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.log("Zoom Error:", err.message);
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

    const meetingNumber = generateMeetingNumber();

    // REQUIRE REAL ZOOM MEETING
    let zoom;
    try {
      zoom = await createZoomMeeting({
        topic: `${className} - ${course}`,
        startTime: new Date().toISOString(),
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

    res.json({
      success: true,
      meeting,
    });
  } catch (err) {
    res.status(500).json({ success: false });
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