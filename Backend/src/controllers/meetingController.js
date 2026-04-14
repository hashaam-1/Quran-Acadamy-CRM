const Meeting = require("../models/Meeting");

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

    // Prevent crash if DB query fails
    let existing = null;
    try {
      existing = await Meeting.findOne({
        scheduleId,
        status: { $in: ["live", "scheduled"] },
      });
    } catch (dbErr) {
      console.log("DB check error:", dbErr.message);
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Class already exists",
      });
    }

    const meetingNumber = generateMeetingNumber();

    // SAFE ZOOM CALL
    let zoom = null;
    try {
      zoom = await createZoomMeeting({
        topic: `${className} - ${course}`,
        startTime: new Date().toISOString(),
      });
    } catch (zErr) {
      console.log("Zoom skipped:", zErr.message);
    }

    let meeting;

    try {
      meeting = await Meeting.create({
        className,
        course,
        scheduleId,
        teacherId,
        teacherName,
        meetingNumber,
        status: "live",
        zoomMeetingId: zoom?.id || meetingNumber,
        participants: [
          {
            userId: teacherId,
            name: teacherName,
            role: 1,
          },
        ],
      });
    } catch (createErr) {
      console.log("Meeting create error:", createErr.message);

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
};