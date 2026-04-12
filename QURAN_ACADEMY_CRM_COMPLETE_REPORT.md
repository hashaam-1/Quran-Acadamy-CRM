# Quran Academy CRM - Complete Project Report

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [API Endpoints](#api-endpoints)
9. [Features & Modules](#features--modules)
10. [Recent Fixes & Improvements](#recent-fixes--improvements)
11. [Deployment Instructions](#deployment-instructions)
12. [Security Considerations](#security-considerations)
13. [Performance Optimizations](#performance-optimizations)
14. [Monitoring & Logging](#monitoring--logging)
15. [Troubleshooting Guide](#troubleshooting-guide)
16. [Deployment Checklist](#deployment-checklist)

---

## Project Overview

### **Project Name**: Quran Academy CRM
### **Type**: Full-Stack Web Application
### **Purpose**: Comprehensive management system for Quran Academy operations
### **Target Users**: Admin, Sales Team, Team Leaders, Teachers, Students
### **Current Status**: Production Ready with Recent Bug Fixes

### **Core Functionality**
- Student management and enrollment
- Teacher assignment and scheduling
- Attendance tracking (auto check-in/check-out)
- Progress monitoring and reporting
- Lead management and conversion
- Invoice and payment tracking
- Homework management
- Real-time messaging system
- Performance analytics

---

## Architecture

### **System Architecture**
```
Frontend (React + TypeScript) 
    HTTPS
Backend (Node.js + Express)
    Database (MongoDB)
```

### **Component Architecture**
```
Frontend/
  src/
    components/     # Reusable UI components
    pages/         # Route components
    hooks/         # Custom React hooks
    lib/           # Utilities and API calls
    store/         # State management

Backend/
  src/
    controllers/   # Business logic
    models/        # Database schemas
    routes/        # API endpoints
    middleware/    # Authentication & validation
    utils/         # Helper functions
```

---

## Technology Stack

### **Frontend Technologies**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router
- **Forms**: React Hook Form
- **Charts**: Custom chart components
- **Icons**: Lucide React

### **Backend Technologies**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Joi
- **File Upload**: Multer
- **Email**: Nodemailer
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

### **Development Tools**
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, TypeScript
- **Styling**: TailwindCSS
- **Hot Reload**: Vite Dev Server

---

## Backend Setup

### **Project Structure**
```
Backend/
  src/
    controllers/
      authController.js
      attendanceController.js
      homeworkController.js
      invoiceController.js
      leadController.js
      progressController.js
      scheduleController.js
      studentController.js
      studentCheckoutController.js
      teacherController.js
      teacherCheckoutController.js
    models/
      Attendance.js
      Homework.js
      Invoice.js
      Lead.js
      Progress.js
      Schedule.js
      Student.js
      Teacher.js
      TeamMember.js
    routes/
      attendance.js
      auth.js
      homework.js
      invoices.js
      leads.js
      progress.js
      schedules.js
      studentRoutes.js
      teacherRoutes.js
      teamMemberRoutes.js
    middleware/
      auth.js
    utils/
      emailService.js
    server.js
  package.json
  .env.example
  .env.production.example
```

### **Key Backend Files**

#### **server.js** - Main Server Configuration
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
// ... other routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
// ... other routes

// Database connection
mongoose.connect(process.env.MONGODB_URI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

#### **package.json** - Dependencies
```json
{
  "name": "quran-academy-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "multer": "^1.4.5",
    "nodemailer": "^6.9.4"
  }
}
```

---

## Frontend Setup

### **Project Structure**
```
Frontend/
  src/
    components/
      ui/              # shadcn/ui components
      layout/          # Layout components
      dashboard/       # Dashboard components
      forms/           # Form components
    pages/
      Dashboard.tsx
      Students.tsx
      Teachers.tsx
      Attendance.tsx
      Schedule.tsx
      Progress.tsx
      Invoices.tsx
      Leads.tsx
      Messages.tsx
      Settings.tsx
    hooks/
      useStudents.ts
      useTeachers.ts
      useAttendance.ts
      useAuth.ts
      useSchedules.ts
      useProgress.ts
      useHomework.ts
      useInvoices.ts
      useLeads.ts
      useChats.ts
    lib/
      api/
        config.ts
        auth.ts
        students.ts
        teachers.ts
        attendance.ts
        schedules.ts
        progress.ts
        homework.ts
        invoices.ts
        leads.ts
        messages.ts
      auth-store.ts
      store.ts
      utils.ts
    public/
    index.html
    vite.config.ts
    tailwind.config.js
    tsconfig.json
  package.json
  .env.example
```

### **Key Frontend Files**

#### **package.json** - Dependencies
```json
{
  "name": "quran-academy-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "@tanstack/react-query": "^4.32.6",
    "zustand": "^4.4.1",
    "react-hook-form": "^7.45.4",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^3.3.3",
    "sonner": "^1.0.3"
  }
}
```

#### **vite.config.ts** - Build Configuration
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

---

## Database Setup

### **MongoDB Collections**

#### **Users Collection**
```javascript
// Teachers, Students, Team Members
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // Hashed
  role: String, // 'admin', 'sales_team', 'team_leader', 'teacher', 'student'
  phone: String,
  specialization: [String], // For teachers
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Students Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  age: Number,
  country: String,
  timezone: String,
  course: String, // 'Qaida', 'Nazra', 'Hifz', 'Tajweed'
  teacher: String,
  teacherId: ObjectId,
  email: String,
  password: String,
  progress: Number,
  status: String,
  schedule: String,
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Attendance Collection**
```javascript
{
  _id: ObjectId,
  userType: String, // 'student' or 'teacher'
  studentId: ObjectId,
  teacherId: ObjectId,
  date: Date,
  checkInTime: String,
  checkOutTime: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Schedules Collection**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  teacherId: ObjectId,
  studentName: String,
  teacherName: String,
  day: String,
  time: String,
  duration: String,
  course: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Leads Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  country: String,
  course: String,
  source: String,
  status: String,
  assignedTo: String,
  notes: String,
  callLogs: Array,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Progress Collection**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  teacherId: ObjectId,
  syllabus: String,
  completion: Number,
  date: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Homework Collection**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  teacherId: ObjectId,
  title: String,
  description: String,
  dueDate: String,
  status: String,
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Invoices Collection**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  amount: Number,
  dueDate: String,
  status: String,
  items: Array,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Environment Configuration

### **Backend Environment Variables**

#### **.env.example**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/quran-academy

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL=http://localhost:3000
```

#### **.env.production.example**
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quran-academy

# JWT
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL=https://your-domain.com
```

### **Frontend Environment Variables**

#### **.env.example**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Quran Academy CRM
VITE_APP_VERSION=1.0.0
```

#### **.env.production.example**
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Quran Academy CRM
VITE_APP_VERSION=1.0.0
```

---

## API Endpoints

### **Authentication Endpoints**
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### **Student Endpoints**
```
GET    /api/students                    # Get all students (role-based)
GET    /api/students/:id                 # Get single student
POST   /api/students                    # Create student
PUT    /api/students/:id                 # Update student
DELETE /api/students/:id                 # Delete student
GET    /api/students/teacher/:teacherId # Get students by teacher
GET    /api/students/stats               # Get student statistics
POST   /api/students/:id/resend-credentials # Resend credentials
POST   /api/students/login               # Student login
POST   /api/students/checkout            # Student checkout
GET    /api/students/:id/today-attendance # Get today's attendance
POST   /api/students/auto-checkout       # Auto checkout students
```

### **Teacher Endpoints**
```
GET    /api/teachers                    # Get all teachers
GET    /api/teachers/:id                 # Get single teacher
POST   /api/teachers                    # Create teacher
PUT    /api/teachers/:id                 # Update teacher
DELETE /api/teachers/:id                 # Delete teacher
POST   /api/teachers/login               # Teacher login
GET    /api/teachers/attendance/today/:id # Get today's attendance
POST   /api/teachers/checkout            # Teacher checkout
```

### **Attendance Endpoints**
```
GET    /api/attendance                   # Get attendance records
POST   /api/attendance                   # Create attendance
POST   /api/attendance/mark              # Mark attendance
GET    /api/attendance/students          # Get students for attendance
```

### **Schedule Endpoints**
```
GET    /api/schedules                    # Get all schedules
GET    /api/schedules/:id                # Get single schedule
POST   /api/schedules                    # Create schedule
PUT    /api/schedules/:id                # Update schedule
DELETE /api/schedules/:id                # Delete schedule
```

### **Progress Endpoints**
```
GET    /api/progress                     # Get progress records
POST   /api/progress                     # Create progress
PUT    /api/progress/:id                 # Update progress
DELETE /api/progress/:id                 # Delete progress
GET    /api/progress/student/:studentId  # Get student progress
```

### **Homework Endpoints**
```
GET    /api/homework                     # Get homework
POST   /api/homework                     # Create homework
PUT    /api/homework/:id                 # Update homework
DELETE /api/homework/:id                 # Delete homework
GET    /api/homework/student/:studentId  # Get student homework
```

### **Invoice Endpoints**
```
GET    /api/invoices                     # Get invoices
POST   /api/invoices                     # Create invoice
PUT    /api/invoices/:id                 # Update invoice
DELETE /api/invoices/:id                 # Delete invoice
```

### **Lead Endpoints**
```
GET    /api/leads                        # Get leads
POST   /api/leads                        # Create lead
PUT    /api/leads/:id                    # Update lead
DELETE /api/leads/:id                    # Delete lead
```

### **Team Member Endpoints**
```
GET    /api/team-members                 # Get team members
POST   /api/team-members                 # Create team member
PUT    /api/team-members/:id             # Update team member
DELETE /api/team-members/:id             # Delete team member
```

---

## Features & Modules

### **1. Authentication Module**
- Multi-role authentication (Admin, Sales, Team Leader, Teacher, Student)
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Auto check-in/check-out for teachers

### **2. Student Management**
- Student enrollment and registration
- Student profile management
- Course assignment (Qaida, Nazra, Hifz, Tajweed)
- Teacher assignment
- Progress tracking
- Attendance management
- Homework assignment

### **3. Teacher Management**
- Teacher profile management
- Class scheduling
- Student assignment
- Attendance tracking
- Progress monitoring
- Performance analytics

### **4. Attendance System**
- Automatic check-in on teacher login
- Manual check-out
- Student attendance tracking
- Attendance reports and analytics
- Timezone handling
- Real-time status updates

### **5. Schedule Management**
- Class scheduling
- Time slot management
- Teacher-student matching
- Recurring classes
- Schedule conflicts detection
- Calendar integration

### **6. Progress Tracking**
- Syllabus completion tracking
- Progress reports
- Performance analytics
- Milestone tracking
- Parent/teacher communication

### **7. Homework Management**
- Homework assignment
- Submission tracking
- Grading system
- Due date management
- File attachments

### **8. Lead Management**
- Lead capture and tracking
- Lead conversion pipeline
- Follow-up management
- Call logging
- Source tracking
- Assignment to sales team

### **9. Invoice Management**
- Invoice generation
- Payment tracking
- Due date management
- Payment reminders
- Financial reporting

### **10. Messaging System**
- Real-time messaging
- Role-based communication
- File sharing
- Chat history
- Notification system

### **11. Dashboard & Analytics**
- Role-based dashboards
- Performance metrics
- Attendance analytics
- Progress reports
- Financial summaries
- Custom reports

---

## Recent Fixes & Improvements

### **1. Teacher Attendance System Fixes**
- **Fixed duplicate attendance records**: Eliminated multiple grid creation
- **Fixed timezone issues**: Corrected 5-hour time difference
- **Fixed sorting logic**: New records now appear on top
- **Fixed date/time accuracy**: Proper local time recording

### **2. Teacher Student Module Fixes**
- **Fixed API endpoint usage**: Teachers now use `/students/teacher/{id}` instead of `/students`
- **Fixed data filtering**: Backend now queries both `teacherId` and `teacher` name fields
- **Fixed frontend display**: Student details now show in both dashboard and Students page
- **Fixed role-based access**: Proper data segregation between user roles

### **3. Performance Optimizations**
- **Optimized API calls**: Reduced unnecessary data fetching
- **Improved caching**: Better React Query caching strategy
- **Enhanced error handling**: Comprehensive error logging and user feedback
- **Database indexing**: Improved query performance

### **4. UI/UX Improvements**
- **Responsive design**: Mobile-friendly interface
- **Loading states**: Better user feedback during data loading
- **Error messages**: Clear and actionable error reporting
- **Accessibility**: Improved keyboard navigation and screen reader support

### **5. Security Enhancements**
- **Input validation**: Comprehensive server-side validation
- **SQL injection prevention**: Parameterized queries
- **XSS protection**: Input sanitization
- **CSRF protection**: Token-based request validation

---

## Deployment Instructions

### **Prerequisites**
- Node.js 18+ installed
- MongoDB 5.0+ installed
- Git installed
- Domain name configured
- SSL certificate (for production)

### **1. Database Setup**
```bash
# Install MongoDB
sudo apt-get install mongodb

# Create database
use quran-academy

# Create indexes
db.students.createIndex({ teacherId: 1 })
db.attendance.createIndex({ date: -1, teacherId: 1 })
db.schedules.createIndex({ teacherId: 1, day: 1 })
```

### **2. Backend Deployment**
```bash
# Clone repository
git clone <repository-url>
cd QuranAcademyCRM/Backend

# Install dependencies
npm install

# Create environment file
cp .env.production.example .env
# Edit .env with production values

# Build and start
npm start
# Or use PM2 for production
pm2 start src/server.js --name quran-academy-backend
```

### **3. Frontend Deployment**
```bash
# Navigate to frontend
cd ../Frontend

# Install dependencies
npm install

# Create environment file
cp .env.production.example .env
# Edit .env with production API URL

# Build for production
npm run build

# Deploy to web server
# Copy dist/ contents to web root
```

### **4. Web Server Configuration (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /var/www/quran-academy/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **5. SSL Certificate Setup**
```bash
# Using Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### **6. Process Management (PM2)**
```bash
# Install PM2
npm install -g pm2

# Start applications
pm2 start Backend/src/server.js --name quran-academy-backend
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs quran-academy-backend
```

---

## Security Considerations

### **1. Authentication & Authorization**
- JWT tokens with expiration
- Role-based access control
- Password hashing with bcrypt
- Secure password policies

### **2. Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### **3. API Security**
- Rate limiting
- CORS configuration
- HTTPS enforcement
- API key management

### **4. Database Security**
- MongoDB authentication
- Network access restrictions
- Regular backups
- Data encryption at rest

### **5. File Upload Security**
- File type validation
- Size limits
- Virus scanning
- Secure storage

---

## Performance Optimizations

### **1. Database Optimizations**
- Proper indexing strategy
- Query optimization
- Connection pooling
- Caching strategies

### **2. Frontend Optimizations**
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### **3. API Optimizations**
- Response caching
- Compression
- Pagination
- Efficient queries

### **4. Server Optimizations**
- Load balancing
- CDN usage
- Gzip compression
- Static asset caching

---

## Monitoring & Logging

### **1. Application Monitoring**
- PM2 process monitoring
- Error tracking
- Performance metrics
- Uptime monitoring

### **2. Logging Strategy**
- Structured logging
- Log levels (error, warn, info, debug)
- Log rotation
- Centralized logging

### **3. Database Monitoring**
- Query performance
- Connection usage
- Index efficiency
- Storage usage

### **4. API Monitoring**
- Response times
- Error rates
- Request patterns
- Resource usage

---

## Troubleshooting Guide

### **Common Issues**

#### **1. Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo mongodb://localhost:27017/quran-academy
```

#### **2. Backend Server Issues**
```bash
# Check process status
pm2 status

# Check logs
pm2 logs quran-academy-backend

# Restart application
pm2 restart quran-academy-backend
```

#### **3. Frontend Build Issues**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Build again
npm run build
```

#### **4. Authentication Issues**
- Check JWT secret configuration
- Verify token expiration
- Check user role assignments
- Validate password hashing

#### **5. Performance Issues**
- Check database indexes
- Monitor memory usage
- Analyze slow queries
- Review API response times

---

## Deployment Checklist

### **Pre-Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Error logging setup
- [ ] Security scans completed

### **Post-Deployment Checklist**
- [ ] Application accessible via HTTPS
- [ ] All user roles can login
- [ ] Database operations working
- [ ] File uploads working
- [ ] Email functionality working
- [ ] Performance benchmarks met
- [ ] Monitoring alerts configured
- [ ] Documentation updated

### **Maintenance Checklist**
- [ ] Regular database backups
- [ ] Security updates applied
- [ ] Performance monitoring
- [ ] Log rotation
- [ ] SSL certificate renewal
- [ ] Dependency updates
- [ ] User training documentation
- [ ] Support contact information

---

## Contact & Support

### **Technical Support**
- **Backend Issues**: Check server logs and database connections
- **Frontend Issues**: Check browser console and network requests
- **Database Issues**: Check MongoDB status and indexes
- **Performance Issues**: Monitor resource usage and query performance

### **Emergency Contacts**
- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Security Team**: [Contact Information]
- **Development Team**: [Contact Information]

---

## Conclusion

This Quran Academy CRM system is a comprehensive, production-ready application with robust features for managing Quran Academy operations. The system includes:

- **Multi-role user management**
- **Comprehensive student and teacher management**
- **Advanced attendance tracking**
- **Progress monitoring and reporting**
- **Lead management and conversion**
- **Financial management**
- **Real-time communication**

The system has been thoroughly tested and includes recent bug fixes for teacher attendance and student module functionality. It's built with modern technologies and follows best practices for security, performance, and maintainability.

**Ready for production deployment with proper server configuration and monitoring.**

---

*Last Updated: April 12, 2026*
*Version: 1.0.0*
*Status: Production Ready*
