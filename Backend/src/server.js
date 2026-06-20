require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
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
    time: new Date(),
  });
});

/* =========================
   ENV TEST ROUTE
========================= */
app.get("/api/env-test", (req, res) => {
  res.json({
    mongodbExists: !!process.env.MONGODB_URI,
    mongodbLength: process.env.MONGODB_URI?.length || 0,
  });
});

/* =========================
   DEBUG ENV ROUTE
========================= */
app.get("/api/debug-env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    ENV_KEYS: Object.keys(process.env).filter(
      k =>
        k.includes("MONGO") ||
        k.includes("DATABASE")
    )
  });
});

/* =========================
   AUTH TEST ROUTE
========================= */
app.get("/api/auth-test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route test working",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   ROUTE LOADER
========================= */
const loadRoute = (routePath, urlPath) => {
  try {
    const route = require(path.join(__dirname, "routes", routePath));
    app.use(urlPath, route);
    console.log("✅ Loaded:", urlPath);
  } catch (err) {
    console.error("❌ FAILED TO LOAD:", urlPath);
    console.error("🔥 FULL ERROR:", err);
    console.error("🔥 STACK:", err.stack);
  }
};

/* =========================
   ROUTES
========================= */
// Load auth routes
loadRoute("authRoutes.js", "/api/auth");

loadRoute("leadRoutes.js", "/api/leads");
loadRoute("studentRoutes.js", "/api/students");
loadRoute("teacherRoutes.js", "/api/teachers");
loadRoute("scheduleRoutes.js", "/api/schedules"); // ✅ FIXED: Use loadRoute for consistency
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
// Serve uploaded files with fallback for missing files
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '../uploads', req.path);
  console.log('🔍 File request:', req.path, 'Full path:', filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log('✅ File found, serving:', filePath);
    return express.static(path.join(__dirname, '../uploads'))(req, res, next);
  } else {
    console.log('❌ File not found:', filePath);
    console.log('📁 Uploads directory contents:');
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const listFiles = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            console.log(prefix + '📁', item + '/');
            listFiles(itemPath, prefix + '  ');
          } else {
            console.log(prefix + '📄', item);
          }
        });
      };
      listFiles(uploadsDir);
    } catch (err) {
      console.log('📁 Could not list uploads directory:', err.message);
    }
    
    // Return a proper error response
    return res.status(404).json({
      success: false,
      message: "File not found - file may have been lost due to server restart",
      path: req.originalUrl,
      suggestion: "Please re-upload the file to fix this issue"
    });
  }
});

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

// Connect to MongoDB first, then start server
const startServer = async () => {
  try {
    console.log("� Connecting to MongoDB...");
    await connectDB();
    console.log("🟢 MongoDB Connected successfully");

    app.listen(PORT, () => {
      console.log(`� Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    // Don't kill Railway container - let it handle the error
  }
};

console.log("========== ENV TEST ==========");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log(
  "ALL MONGO KEYS:",
  Object.keys(process.env).filter(k => k.includes("MONGO"))
);
console.log("==============================");

startServer();

// Add mongoose connection event listeners
mongoose.connection.on("connected", () => {
  console.log("🔥 MONGO READY EVENT");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongo event error", err);
});