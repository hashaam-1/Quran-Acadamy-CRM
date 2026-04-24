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

/* Mock User */
router.use((req, res, next) => {
  if (!req.user) {
    req.user = {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      role: "teacher"
    };
  }
  next();
});

/* Routes */
router.post("/start-class", startClass);
router.post("/join/:meetingNumber", joinClass);
router.get("/teacher/meetings", getTeacherMeetings);
router.get("/student/meetings", getStudentMeetings);
router.put("/end-class/:meetingNumber", endClass);
router.get("/test-zoom", testZoomCredentials);
router.get("/:meetingNumber", getMeetingDetails);
router.post("/schedule/:scheduleId/create-meeting", createScheduledMeeting);
router.delete("/:meetingNumber", deleteMeeting);

/* New Teacher and Student Routes */
router.get("/teacher/:teacherId", getTeacherMeetings);
router.get("/student/available", getStudentMeetings);
router.post("/:meetingId/end", endClass);

module.exports = router;