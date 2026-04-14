const Meeting = require("../../models/Meeting");

let axios = null;
try {
  axios = require("axios");
} catch (err) {
  console.log("Axios not installed - Zoom disabled");
}

/* Generate Meeting Number */
const generateMeetingNumber = () => {
  return Date.now().toString().slice(-10);
};

/* Optional Zoom Meeting */
const createZoomMeeting = async ({ topic, startTime }) => {
  try {
    if (!axios || !process.env.ZOOM_JWT_TOKEN) return null;

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 1,
        start_time: startTime,
        duration: 60
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.log("Zoom Error:", err.message);
    return null;
  }
};

/* Start Class */
const startClass = async (req, res) => {
  try {
    const { className, course, scheduleId } = req.body;

    const teacherId = req.user?.id || "guest";
    const teacherName = req.user?.name || "Guest";

    const existing = await Meeting.findOne({
      scheduleId,
      status: { $in: ["live", "scheduled"] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Class already exists"
      });
    }

    const meetingNumber = generateMeetingNumber();

    const zoom = await createZoomMeeting({
      topic: `${className} - ${course}`,
      startTime: new Date().toISOString()
    });

    const meeting = await Meeting.create({
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
          role: 1
        }
      ]
    });

    res.json({
      success: true,
      meeting
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to start class"
    });
  }
};

/* Join Class */
const joinClass = async (req, res) => {
  try {
    const { meetingNumber } = req.params;

    const meeting = await Meeting.findOne({ meetingNumber });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    const already = meeting.participants.find(
      (p) => String(p.userId) === String(req.user.id)
    );

    if (!already) {
      meeting.participants.push({
        userId: req.user.id,
        name: req.user.name,
        role: 0
      });

      await meeting.save();
    }

    res.json({
      success: true,
      meeting
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Join failed"
    });
  }
};

/* Teacher Meetings */
const getTeacherMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      teacherId: req.user.id
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

/* Student Meetings */
const getStudentMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      "participants.userId": req.user.id
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

/* End Class */
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

/* Details */
const getMeetingDetails = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingNumber: req.params.meetingNumber
    });

    res.json({
      success: true,
      meeting
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
  getMeetingDetails
};
