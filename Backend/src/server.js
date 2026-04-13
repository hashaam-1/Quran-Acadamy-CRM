console.log("SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const connectDB = require("./config/database.js");

// Routes
const leadRoutes = require("./routes/leadRoutes.js");
const studentRoutes = require("./routes/studentRoutes.js");
const teacherRoutes = require("./routes/teacherRoutes.js");
const scheduleRoutes = require("./routes/scheduleRoutes.js");
const invoiceRoutes = require("./routes/invoiceRoutes.js");
const progressRoutes = require("./routes/progressRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const studentLeaveRoutes = require("./routes/studentLeaveRoutes.js");
const teamMemberRoutes = require("./routes/teamMemberRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes.js");
const attendanceRoutes = require("./routes/attendance.js");
const chatRoutes = require("./routes/chat.js");
const settingRoutes = require("./routes/settingRoutes.js");
const syllabusRoutes = require("./routes/syllabusRoutes.js");
const homeworkRoutes = require("./routes/homeworkRoutes.js");
const meetingRoutes = require("./routes/meetingRoutes.js");
const zoomRoutes = require("./routes/zoom.js");

dotenv.config();

const app = express();

/* =========================
   HEALTH CHECK (RAILWAY)
========================= */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    message: "Backend running fine",
    db: mongoose.connection?.readyState === 1 ? "connected" : "not connected",
    time: new Date().toISOString()
  });
});

/* =========================
   GLOBAL MIDDLEWARE
========================= */
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

/* =========================
   ROUTES
========================= */
app.use("/api/leads", leadRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/student-leaves", studentLeaveRoutes);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/zoom", zoomRoutes);

/* =========================
   ERROR HANDLERS
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
});

/* =========================
   START SERVER (FIXED)
========================= */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();
    console.log("DB Connected");

    app.listen(PORT, () => {
      console.log("Server running on port:", PORT);
    });

  } catch (err) {
    console.error("CRITICAL ERROR:", err.message);

    // IMPORTANT: DO NOT EXIT (Railway needs process alive)
    app.listen(PORT, () => {
      console.log("Server started WITHOUT DB (fallback mode)");
    });
  }
};

startServer();

module.exports = app;