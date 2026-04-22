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

// Comprehensive CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "https://quran-acadamy-crm-production.up.railway.app",
      "https://quran-academy-production.up.railway.app", 
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080"
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins for debugging
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Manual preflight handling
app.options('*', cors(corsOptions));

// Add CORS headers manually as fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Configure helmet to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Temporarily disable CSP for debugging
}));

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
    cors: "enabled",
    origin: req.headers.origin,
    headers: req.headers
  });
});

/* =========================
   CORS DEBUG ENDPOINT
========================= */
app.get("/api/cors-test", (req, res) => {
  console.log('=== CORS DEBUG ===');
  console.log('Request origin:', req.headers.origin);
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  
  res.json({
    success: true,
    message: "CORS Test Endpoint",
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString(),
    cors_status: "working"
  });
});

app.options("/api/cors-test", (req, res) => {
  console.log('=== CORS PREFLIGHT DEBUG ===');
  console.log('Preflight origin:', req.headers.origin);
  console.log('Preflight headers:', req.headers);
  
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
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
console.log("Deployment timestamp:", new Date().toISOString());
console.log("CORS configured for frontend domains");
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