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
   SECURITY + MIDDLEWARE
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend Running",
    db: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    time: new Date().toISOString(),
  });
});

/* =========================
   ROUTE LOADER
========================= */
const loadRoute = (routePath, urlPath) => {
  try {
    const route = require(path.join(__dirname, "routes", routePath));
    app.use(urlPath, route);
    console.log("Loaded:", urlPath);
  } catch (err) {
    console.log("Skipped:", urlPath, "-", err.message);
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
//loadRoute("syllabusRoutes.js", "/api/syllabus");
//loadRoute("homeworkRoutes.js", "/api/homework");
//loadRoute("meetingRoutes.js", "/api/meetings");

/* =========================
   ZOOM ROUTE (IMPORTANT FIXED)
========================= */
try {
  const zoomRoutes = require("./routes/zoom.js");
  app.use("/api/zoom", zoomRoutes);
  console.log("🚀 Zoom route loaded");
} catch (err) {
  console.error("❌ Zoom route failed:", err.message);
}

/* =========================
   STATIC FILE SERVING
========================= */
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error: err.message,
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

console.log("=== SERVER STARTING ===");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Working directory:", process.cwd());
console.log("=====================");

const server = app.listen(PORT, async () => {
  console.log("Server running on port:", PORT);

  try {
    await connectDB();
    console.log(" MongoDB Connected");
    console.log(" Server ready and accepting connections");
  } catch (err) {
    console.error(" DB Connection Failed:", err.message);
    console.error(" Server will continue running without database");
  }
});

// Handle server errors
server.on('error', (err) => {
  console.error(' Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} is already in use`);
  } else {
    console.error(' Unknown server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(' SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log(' Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log(' SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log(' Process terminated');
  });
});