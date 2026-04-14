require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const connectDB = require("./config/database");

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

/* =========================
   HEALTHCHECK FIRST
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Running",
    time: new Date().toISOString()
  });
});

/* =========================
   SAFE ROUTE LOADER
========================= */
const loadRoute = (path, routePath) => {
  try {
    const route = require(path);
    app.use(routePath, route);
    console.log("Loaded:", routePath);
  } catch (err) {
    console.log("Skipped:", routePath, "-", err.message);
  }
};

loadRoute("./routes/leadRoutes", "/api/leads");
loadRoute("./routes/studentRoutes", "/api/students");
loadRoute("./routes/teacherRoutes", "/api/teachers");
loadRoute("./routes/scheduleRoutes", "/api/schedules");
loadRoute("./routes/invoiceRoutes", "/api/invoices");
loadRoute("./routes/progressRoutes", "/api/progress");
loadRoute("./routes/messageRoutes", "/api/messages");
loadRoute("./routes/studentLeaveRoutes", "/api/student-leaves");
loadRoute("./routes/teamMemberRoutes", "/api/team-members");
loadRoute("./routes/dashboardRoutes", "/api/dashboard");
loadRoute("./routes/attendance", "/api/attendance");
loadRoute("./routes/chat", "/api/chats");
loadRoute("./routes/settingRoutes", "/api/settings");
loadRoute("./routes/syllabusRoutes", "/api/syllabus");
loadRoute("./routes/homeworkRoutes", "/api/homework");
loadRoute("./routes/meetingRoutes", "/api/meetings");
loadRoute("./routes/zoom", "/api/zoom");

/* =========================
   404
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Server Error",
    error: err.message
  });
});

/* =========================
   START SERVER FIRST
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await connectDB();
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("MongoDB Failed:", err.message);
  }
});