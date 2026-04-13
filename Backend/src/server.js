console.log("SERVER RUNNING FILE ACTIVE - PRODUCTION MODE");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/database.js");

// Load env first
dotenv.config();

const app = express();

/* =========================
   HEALTH CHECK (RAILWAY)
========================= */
app.get("/api/health", (req, res) => {
  console.log("HEALTHCHECK HIT");
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
  });
});

/* =========================
   MIDDLEWARE
========================= */
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   REQUEST LOGGER (SAFE)
========================= */
app.use((req, res, next) => {
  if (req.url !== "/api/health") {
    console.log("REQ:", req.method, req.url);
  }
  next();
});

/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static("uploads"));

/* =========================
   ROUTES
========================= */
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

/* Safe Zoom import */
let zoomRoutes;
try {
  zoomRoutes = require("./routes/zoom.js");
  console.log("Zoom routes loaded");
} catch (err) {
  console.error("Zoom routes failed:", err.message);
}

/* =========================
   ROUTE MOUNTING
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

/* Zoom routes only if loaded */
if (zoomRoutes) {
  app.use("/api/zoom", zoomRoutes);
}

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER (IMPORTANT FIX)
========================= */
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("DB CONNECTION FAILED:", err.message);
    process.exit(1);
  });

module.exports = app;