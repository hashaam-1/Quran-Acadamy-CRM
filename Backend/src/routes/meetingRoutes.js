const express = require("express");
const router = express.Router();

const {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails
} = require("../controllers/meetingController");

/* =========================
   TEST ROUTE
========================= */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Meeting routes working"
  });
});

/* =========================
   MOCK USER (FOR TESTING)
========================= */
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

/* =========================
   ROUTES
========================= */
router.post("/start-class", startClass);
router.post("/join/:meetingNumber", joinClass);
router.get("/teacher/meetings", getTeacherMeetings);
router.get("/student/meetings", getStudentMeetings);
router.put("/end-class/:meetingNumber", endClass);
router.get("/:meetingNumber", getMeetingDetails);

module.exports = router;