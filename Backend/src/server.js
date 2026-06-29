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

// Global request logger to catch ALL requests
app.use((req, res, next) => {
  console.log("🌐 GLOBAL REQUEST:", {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});
app.use(cors({
  origin: [
    'https://quran-academy-crm-frontend-production.up.railway.app',
    'https://quran-academy-crm-frontend-production.up.railway.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','cache-control','X-Requested-With','Accept','pragma','expires']
}));
app.options('*', cors());
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
loadRoute("paymentRoutes.js", "/api/payments");
loadRoute("exchangeRateRoutes.js", "/api/exchange-rates");
// loadRoute("meetingRoutes.js", "/api/meetings"); // COMMENTED OUT ZOOM MEETING FUNCTIONALITY

/* =========================
   ZOOM ROUTE (IMPORTANT FIXED) - COMMENTED OUT
========================= */
// try {
//   const zoomRoutes = require("./routes/zoom.js");
//   app.use("/api/zoom", zoomRoutes);
//   console.log("🚀 Zoom route loaded");
// } catch (err) {
//   console.error("❌ Zoom route failed:", err.message);
// }

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

startServer();

// Add mongoose connection event listeners
mongoose.connection.on("connected", () => {
  console.log("🔥 MONGO READY EVENT");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongo event error", err);
});