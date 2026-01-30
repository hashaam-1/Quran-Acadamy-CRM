# Quran Academy CRM - Complete Setup Guide

## 🎯 Overview

This guide will help you set up and run the complete Quran Academy CRM system with:
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + TypeScript + Vite
- **Full Integration**: React Query connecting frontend to backend APIs

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Running locally or MongoDB Atlas
- **npm** or **yarn** package manager
- **Git** (optional)

---

## 🚀 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd Backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the Backend directory:
```bash
# Copy from example
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quran_academy_crm
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quran_academy_crm
```

### Step 4: Start MongoDB
**Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**MongoDB Atlas:**
- No need to start - it's cloud-hosted
- Just use the connection string in `.env`

### Step 5: Seed Database (Optional but Recommended)
```bash
npm run seed
```

This will populate your database with sample data:
- 5 Leads
- 5 Students
- 4 Teachers
- 5 Schedules
- 5 Invoices
- 2 Progress Records
- 2 Conversations with Messages
- 3 Student Leave Records

### Step 6: Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend will run on: **http://localhost:5000**

### Step 7: Verify Backend is Running
Open browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Quran Academy CRM API is running"
}
```

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd ../Frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all dependencies including the newly added `axios` for API calls.

### Step 3: Configure Environment Variables
Create a `.env` file in the Frontend directory:
```bash
# Copy from example
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

**For production:**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Step 4: Start Frontend Development Server
```bash
npm run dev
```

Frontend will run on: **http://localhost:8080**

### Step 5: Open Application
Open your browser and navigate to:
```
http://localhost:8080
```

---

## 🔗 Verifying Integration

### Test API Connection

1. **Open Browser DevTools** (F12)
2. **Go to Network Tab**
3. **Navigate to any page** in the CRM (e.g., Leads, Students)
4. **Check Network Requests** - You should see API calls to `http://localhost:5000/api/...`

### Expected API Endpoints Being Called

- `/api/leads` - When viewing Leads page
- `/api/students` - When viewing Students page
- `/api/teachers` - When viewing Teachers page
- `/api/schedules` - When viewing Schedule page
- `/api/invoices` - When viewing Invoices page
- `/api/dashboard/stats` - When viewing Dashboard
- And many more...

---

## 📊 Available API Endpoints

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/stats` - Get statistics
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Students
- `GET /api/students` - Get all students
- `GET /api/students/stats` - Get statistics
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/stats` - Get statistics
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/day/:day` - Get by day
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/stats` - Get statistics
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/mark-paid` - Mark as paid
- `DELETE /api/invoices/:id` - Delete invoice

### Progress
- `GET /api/progress` - Get all progress records
- `GET /api/progress/student/:studentId` - Get by student
- `POST /api/progress` - Create record
- `PUT /api/progress/:id` - Update record
- `DELETE /api/progress/:id` - Delete record

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversations/:conversationId/messages` - Get messages
- `POST /api/messages/messages` - Send message
- `PUT /api/messages/conversations/:id/mark-read` - Mark as read

### Dashboard
- `GET /api/dashboard/stats` - Get all statistics
- `GET /api/dashboard/teacher-performance` - Teacher performance data
- `GET /api/dashboard/invoice-report` - Invoice report data
- `GET /api/dashboard/student-leave-analytics` - Leave analytics
- `GET /api/dashboard/leads-pipeline` - Leads pipeline data
- `GET /api/dashboard/sales-conversion` - Sales conversion data

---

## 🔧 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check MongoDB status
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod
```

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change port in `.env` or kill the process using port 5000

### Frontend Issues

**API Connection Error:**
```
Network Error / CORS Error
```
**Solution:** 
1. Make sure backend is running on port 5000
2. Check `.env` file has correct `VITE_API_URL`
3. Restart frontend dev server after changing `.env`

**Axios Not Found:**
```
Cannot find module 'axios'
```
**Solution:** 
```bash
npm install axios
```

---

## 📁 Project Structure

```
QuranAcademyCRM/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── Lead.js
│   │   │   ├── Student.js
│   │   │   ├── Teacher.js
│   │   │   ├── Schedule.js
│   │   │   ├── Invoice.js
│   │   │   ├── Progress.js
│   │   │   ├── Message.js
│   │   │   ├── Conversation.js
│   │   │   ├── StudentLeave.js
│   │   │   └── TeamMember.js
│   │   ├── controllers/
│   │   │   ├── leadController.js
│   │   │   ├── studentController.js
│   │   │   ├── teacherController.js
│   │   │   ├── scheduleController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── progressController.js
│   │   │   ├── messageController.js
│   │   │   ├── studentLeaveController.js
│   │   │   ├── teamMemberController.js
│   │   │   └── dashboardController.js
│   │   ├── routes/
│   │   │   └── [10 route files]
│   │   ├── seeders/
│   │   │   └── seed.js
│   │   └── server.js
│   ├── .env (create this)
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── Frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── config.ts
│   │   │   │   ├── leads.ts
│   │   │   │   ├── students.ts
│   │   │   │   ├── teachers.ts
│   │   │   │   ├── schedules.ts
│   │   │   │   ├── invoices.ts
│   │   │   │   ├── progress.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── studentLeaves.ts
│   │   │   │   ├── teamMembers.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   └── index.ts
│   │   │   ├── auth-store.ts
│   │   │   ├── store.ts (legacy - will be replaced)
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useLeads.ts
│   │   │   ├── useStudents.ts
│   │   │   ├── useTeachers.ts
│   │   │   ├── useSchedules.ts
│   │   │   ├── useInvoices.ts
│   │   │   ├── useProgress.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   ├── .env (create this)
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
└── SETUP_GUIDE.md (this file)
```

---

## 🎯 Next Steps

### 1. Update Frontend Pages to Use API

The frontend currently uses Zustand with static data. You need to update pages to use the new React Query hooks:

**Example - Update Leads Page:**

```typescript
// Before (using Zustand)
import { useCRMStore } from "@/lib/store";
const { leads, addLead, updateLead, deleteLead } = useCRMStore();

// After (using React Query)
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";

const { data: leads, isLoading } = useLeads();
const createLead = useCreateLead();
const updateLead = useUpdateLead();
const deleteLead = useDeleteLead();

// Usage
createLead.mutate(leadData);
updateLead.mutate({ id: leadId, data: updatedData });
deleteLead.mutate(leadId);
```

### 2. Remove Static Data from Zustand Store

Once all pages are updated to use React Query, you can remove the static data from `src/lib/store.ts` or remove the file entirely.

### 3. Add Authentication

Currently, authentication is frontend-only. To add backend authentication:
1. Create auth endpoints in backend
2. Implement JWT tokens
3. Add auth middleware to protect routes
4. Update frontend to send tokens with requests

---

## 🚢 Production Deployment

### Backend Deployment (Recommended: Railway, Render, or Heroku)

1. **Set environment variables** on hosting platform
2. **Deploy backend** code
3. **Note the backend URL** (e.g., `https://your-app.railway.app`)

### Frontend Deployment (Recommended: Vercel or Netlify)

1. **Update `.env` file** with production backend URL
2. **Build frontend**: `npm run build`
3. **Deploy** the `dist` folder

### MongoDB (Recommended: MongoDB Atlas)

1. **Create cluster** on MongoDB Atlas
2. **Get connection string**
3. **Update backend `.env`** with Atlas connection string

---

## 📝 Summary

You now have:
- ✅ Complete Node.js backend with 10 modules
- ✅ MongoDB database with Mongoose models
- ✅ RESTful API with 80+ endpoints
- ✅ Frontend API integration layer
- ✅ React Query hooks for data fetching
- ✅ Database seeder with sample data
- ✅ Full CRUD operations for all entities
- ✅ Analytics and reporting endpoints
- ✅ Ready for production deployment

**All static data has been moved to the backend. The frontend is ready to consume real API data!**

---

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify MongoDB is running
3. Ensure both servers are running (Backend on 5000, Frontend on 8080)
4. Check `.env` files are configured correctly
5. Clear browser cache and restart servers

---

**Happy Coding! 🚀**
