console.log("SERVER RUNNING FILE ACTIVE - STEP 3 DEBUG");

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database.js');

// Import routes
const leadRoutes = require('./routes/leadRoutes.js');
const studentRoutes = require('./routes/studentRoutes.js');
const teacherRoutes = require('./routes/teacherRoutes.js');
const scheduleRoutes = require('./routes/scheduleRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js');
const progressRoutes = require('./routes/progressRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');


// Load environment variables
dotenv.config();

console.log("ACTIVE SERVER FILE: Backend/src/server.js - CORRECT FILE RUNNING");

const app = express();

// Health check endpoint - MUST BE FIRST for Railway
app.get("/api/health", (req, res) => {
  console.log("HEALTHCHECK HIT - Backend is responding");
  res.status(200).json({ 
    status: "OK", 
    message: "Quran Academy CRM Backend is running",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global request logger - STEP 1 DEBUG
app.use((req, res, next) => {
  console.log("REQUEST HIT:", req.method, req.url);
  next();
});

// Middleware
app.use(helmet()); // Security headers

// CORS configuration for deployment
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Enable CORS

app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/zoom', require('./routes/zoom.js'));
console.log("Zoom mounted at /api/zoom");
console.log("Meetings mounted at /api/meetings");

// Zoom health check endpoint
app.get('/api/zoom/health', (req, res) => {
  res.json({ status: 'OK', message: 'Zoom API endpoints are available' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);

  connectDB()
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("DB error:", err.message));
});

module.exports = app;
