const Meeting = require("../models/Meeting");

/* =========================
   SAFE AXIOS IMPORT
========================= */
let axios = null;
try {
  axios = require("axios");
} catch (e) {
  console.log("Axios not installed - Zoom disabled");
}

/* =========================
   MEETING NUMBER
========================= */
const generateMeetingNumber = () => {
  return Date.now().toString().slice(-10);
};

/* =========================
   ZOOM (SAFE)
========================= */
const createZoomMeeting = async (data) => {
  if (!axios || !process.env.ZOOM_JWT_TOKEN) {
    return null;
  }

  try {
    const res = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: data.topic,
        type: 1,
        start_time: data.startTime,
        duration: 60
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data;
  } catch (err) {
    console.log("Zoom error:", err.message);
    return null;
  }
};

/* =========================
   START CLASS
========================= */
const startClass = async (req, res) => {
  try {
    const { className, course, scheduleId } = req.body;

    const teacherId = req.user.id;
    const teacherName = req.user.name;

    const existing = await Meeting.findOne({
      scheduleId,
      status: { $in: ["live", "scheduled"] }
    });

    if (existing) {
      return res.status(400).json({ message: "Class already exists" });
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

    res.json({ success: true, meeting });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start class" });
  }
};

/* =========================
   JOIN CLASS
========================= */
const joinClass = async (req, res) => {
  try {
    const { meetingNumber } = req.params;

    const meeting = await Meeting.findOne({ meetingNumber });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.participants.push({
      userId: req.user.id,
      name: req.user.name,
      role: 0
    });

    await meeting.save();

    res.json({ success: true, meeting });

  } catch (err) {
    res.status(500).json({ message: "Join failed" });
  }
};

/* =========================
   GET TEACHER MEETINGS
========================= */
const getTeacherMeetings = async (req, res) => {
  const meetings = await Meeting.find({ teacherId: req.user.id });
  res.json({ meetings });
};

/* =========================
   GET STUDENT MEETINGS
========================= */
const getStudentMeetings = async (req, res) => {
  const meetings = await Meeting.find({
    "participants.userId": req.user.id
  });

  res.json({ meetings });
};

/* =========================
   END CLASS
========================= */
const endClass = async (req, res) => {
  await Meeting.updateOne(
    { meetingNumber: req.params.meetingNumber },
    { status: "ended" }
  );

  res.json({ success: true });
};

/* =========================
   DETAILS
========================= */
const getMeetingDetails = async (req, res) => {
  const meeting = await Meeting.findOne({
    meetingNumber: req.params.meetingNumber
  });

  res.json({ meeting });
};

module.exports = {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails
};