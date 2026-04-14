require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const connectDB = require("./config/database");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

/* =========================
   HEALTH CHECK (RAILWAY)
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Running",
    db:
      mongoose.connection.readyState === 1
        ? "connected"
        : "not connected",
    time: new Date().toISOString(),
  });
});

/* =========================
   SAFE ROUTE LOADER
========================= */
const loadRoute = (routePath, urlPath) => {
  try {
    console.log("Loading route:", routePath);
    const route = require(path.join(__dirname, "routes", routePath));
    app.use(urlPath, route);
    console.log("Successfully loaded:", urlPath);
  } catch (err) {
    console.error("FAILED to load route:", urlPath, "-", err.message);
    console.error("Full error:", err);
  }
};

/* =========================
   ROUTES
========================= */
loadRoute("leadRoutes.js", "/api/leads");
loadRoute("studentRoutes.js", "/api/students");
loadRoute("teacherRoutes.js", "/api/teachers");
loadRoute("scheduleRoutes.js", "/api/schedules");
loadRoute("invoiceRoutes.js", "/api/invoices");
loadRoute("progressRoutes.js", "/api/progress");
loadRoute("messageRoutes.js", "/api/messages");
loadRoute("studentLeaveRoutes.js", "/api/student-leaves");
loadRoute("teamMemberRoutes.js", "/api/team-members");
loadRoute("dashboardRoutes.js", "/api/dashboard");
loadRoute("attendance.js", "/api/attendance");
loadRoute("chat.js", "/api/chats");
loadRoute("settingRoutes.js", "/api/settings");
loadRoute("syllabusRoutes.js", "/api/syllabus");
loadRoute("homeworkRoutes.js", "/api/homework");
loadRoute("meetingRoutes.js", "/api/meetings");
loadRoute("zoom.js", "/api/zoom");

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
    error: err.message,
  });
});

/* =========================
   START SERVER (RAILWAY SAFE)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log("Server running on port:", PORT);

  // DB connects AFTER server starts (IMPORTANT FOR RAILWAY)
  await connectDB();
});