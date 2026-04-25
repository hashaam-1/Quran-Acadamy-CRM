const express = require("express");
const router = express.Router();

const {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails,
  createScheduledMeeting,
  deleteMeeting,
  testZoomCredentials
} = require("../controllers/meetingController");

/* Test */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Meeting routes working"
  });
});

// 🔒 SECURE: Remove mock user middleware to prevent session contamination
// Real authentication middleware should be used instead

/* Routes */
router.post("/start-class", startClass);
router.post("/join/:meetingNumber", joinClass);
router.get("/teacher/meetings", getTeacherMeetings);
router.get("/student/meetings", getStudentMeetings);
router.put("/end-class/:meetingNumber", endClass);
router.get("/test-zoom", testZoomCredentials);
router.get("/:meetingNumber", getMeetingDetails);
router.get("/details/:meetingNumber", getMeetingDetails); // ✅ Add details route for frontend
router.post("/schedule/:scheduleId/create-meeting", createScheduledMeeting);
router.delete("/:meetingNumber", deleteMeeting);

/* New Teacher and Student Routes */
router.get("/teacher/:teacherId", getTeacherMeetings);
router.get("/student/available", getStudentMeetings);
router.post("/:meetingId/end", endClass);

module.exports = router;