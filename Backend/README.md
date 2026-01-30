# Quran Academy CRM - Backend API

Complete Node.js + Express + MongoDB backend for Quran Academy CRM system.

## Features

- **RESTful API** for all CRM modules
- **MongoDB** with Mongoose ODM
- **Complete CRUD operations** for all entities
- **Advanced analytics** and reporting endpoints
- **Data aggregation** for charts and dashboards
- **Optimized queries** with indexes

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS enabled
- Helmet (Security)
- Morgan (Logging)
- Compression

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quran_academy_crm
NODE_ENV=development
```

4. Seed the database (optional):
```bash
npm run seed
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/stats` - Get lead statistics
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/call-logs` - Add call log

### Students
- `GET /api/students` - Get all students
- `GET /api/students/stats` - Get student statistics
- `GET /api/students/teacher/:teacherId` - Get students by teacher
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/stats` - Get teacher statistics
- `GET /api/teachers/:id` - Get single teacher
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `PUT /api/teachers/:id/update-student-count` - Update student count
- `DELETE /api/teachers/:id` - Delete teacher

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/stats` - Get schedule statistics
- `GET /api/schedules/day/:day` - Get schedules by day
- `GET /api/schedules/teacher/:teacherId` - Get schedules by teacher
- `GET /api/schedules/:id` - Get single schedule
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule
- `POST /api/schedules/:id/reschedule` - Request reschedule
- `PUT /api/schedules/:id/reschedule/handle` - Approve/reject reschedule

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/stats` - Get invoice statistics
- `GET /api/invoices/student/:studentId` - Get invoices by student
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/mark-paid` - Mark as paid
- `DELETE /api/invoices/:id` - Delete invoice

### Progress
- `GET /api/progress` - Get all progress records
- `GET /api/progress/stats` - Get progress statistics
- `GET /api/progress/latest` - Get latest progress for all students
- `GET /api/progress/student/:studentId` - Get progress by student
- `GET /api/progress/:id` - Get single progress record
- `POST /api/progress` - Create progress record
- `PUT /api/progress/:id` - Update progress record
- `DELETE /api/progress/:id` - Delete progress record

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversations/:id` - Get single conversation
- `POST /api/messages/conversations` - Create conversation
- `DELETE /api/messages/conversations/:id` - Delete conversation
- `PUT /api/messages/conversations/:id/mark-read` - Mark as read
- `GET /api/messages/conversations/:conversationId/messages` - Get messages
- `POST /api/messages/messages` - Send message

### Student Leaves
- `GET /api/student-leaves` - Get all student leaves
- `GET /api/student-leaves/stats` - Get leave statistics
- `POST /api/student-leaves` - Create leave record
- `DELETE /api/student-leaves/:id` - Delete leave record

### Team Members
- `GET /api/team-members` - Get all team members
- `GET /api/team-members/stats` - Get team statistics
- `GET /api/team-members/:id` - Get single team member
- `POST /api/team-members` - Create team member
- `PUT /api/team-members/:id` - Update team member
- `DELETE /api/team-members/:id` - Delete team member

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/teacher-performance` - Get teacher performance data
- `GET /api/dashboard/invoice-report` - Get invoice report data
- `GET /api/dashboard/student-leave-analytics` - Get leave analytics
- `GET /api/dashboard/leads-pipeline` - Get leads pipeline data
- `GET /api/dashboard/student-progress/:studentId` - Get student progress data
- `GET /api/dashboard/sales-conversion` - Get sales conversion data

### Health Check
- `GET /api/health` - API health check

## Database Models

- **Lead** - Lead management with call logs
- **Student** - Student information and progress
- **Teacher** - Teacher profiles and performance
- **Schedule** - Class scheduling with reschedule support
- **Invoice** - Billing and payment tracking
- **Progress** - Student progress records with homework
- **Message** - WhatsApp messages
- **Conversation** - WhatsApp conversations
- **StudentLeave** - Student leave tracking
- **TeamMember** - Team member management

## Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Lead.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Schedule.js
│   │   ├── Invoice.js
│   │   ├── Progress.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── StudentLeave.js
│   │   └── TeamMember.js
│   ├── controllers/
│   │   ├── leadController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── scheduleController.js
│   │   ├── invoiceController.js
│   │   ├── progressController.js
│   │   ├── messageController.js
│   │   ├── studentLeaveController.js
│   │   ├── teamMemberController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── leadRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── progressRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── studentLeaveRoutes.js
│   │   ├── teamMemberRoutes.js
│   │   └── dashboardRoutes.js
│   ├── seeders/
│   │   └── seed.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)

## License

ISC
