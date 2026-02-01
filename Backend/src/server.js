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
const studentLeaveRoutes = require('./routes/studentLeaveRoutes.js');
const teamMemberRoutes = require('./routes/teamMemberRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const attendanceRoutes = require('./routes/attendance.js');
const chatRoutes = require('./routes/chat.js');
const settingRoutes = require('./routes/settingRoutes.js');
const syllabusRoutes = require('./routes/syllabusRoutes.js');
const homeworkRoutes = require('./routes/homeworkRoutes.js');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

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
app.use('/api/messages', messageRoutes);
app.use('/api/student-leaves', studentLeaveRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/team', teamMemberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/homework', homeworkRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quran Academy CRM API is running' });
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
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
