# Email Functionality Setup Guide

## 🎯 Overview

The system now automatically sends welcome emails with login credentials when admin creates:
- **Teachers** - Receive teacher portal access
- **Sales Team Members** - Receive CRM access
- **Team Leaders** - Receive CRM access

## ✨ Features Implemented

### 1. **Automatic Password Generation**
- Secure 12-character passwords with uppercase, lowercase, numbers, and symbols
- Unique user IDs generated for each role (e.g., `TCH-ABC123-XYZ`, `SLS-DEF456-UVW`)
- Passwords are hashed using bcrypt before storing in database

### 2. **Professional Email Templates**
- Beautiful HTML email templates with branding
- Separate templates for teachers and team members
- Includes login credentials, role information, and getting started guide
- Security warnings about changing temporary passwords

### 3. **Email Sending**
- Uses Nodemailer for reliable email delivery
- Supports Gmail, Outlook, and custom SMTP servers
- Automatic error handling and logging
- Returns success/failure status to frontend

## 📧 Email Configuration

### Step 1: Update Backend `.env` File

Add these variables to `Backend/.env`:

```env
# Frontend URL
FRONTEND_URL=http://localhost:8080

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Quran Academy CRM
```

### Step 2: Gmail Setup (Recommended)

#### Option A: Using Gmail App Password (Most Secure)

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)** → Enter "Quran Academy CRM"
6. Click **Generate**
7. Copy the 16-character password
8. Use this password in `EMAIL_PASSWORD` in `.env`

#### Option B: Using Less Secure Apps (Not Recommended)

1. Go to https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. Use your regular Gmail password in `.env`

**Note**: Google may block this method. App passwords are more reliable.

### Step 3: Other Email Providers

#### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### **Yahoo Mail**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

#### **Custom SMTP Server**
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-smtp-password
```

### Step 4: Restart Backend Server

After updating `.env`:
```bash
cd Backend
# Server will auto-restart if using nodemon
# Or manually restart: Ctrl+C then npm run dev
```

## 🧪 Testing Email Functionality

### Test 1: Create a Teacher

1. Open frontend: http://localhost:8080
2. Login as admin
3. Go to **Teachers** page
4. Click **Add Teacher**
5. Fill in the form with a **real email address** (yours for testing)
6. Click **Save**

**Expected Result:**
- Teacher created successfully
- Email sent to the provided address
- Check your inbox for welcome email with credentials

### Test 2: Create a Team Member

1. Go to **Settings** → **User Management**
2. Click **Add Team Member**
3. Fill in form with role (Sales Team or Team Leader)
4. Use a real email address
5. Click **Save**

**Expected Result:**
- Team member created
- Welcome email received with login credentials

### Test 3: Verify Email Content

The email should contain:
- ✅ Welcome message with name
- ✅ Unique User ID
- ✅ Temporary password
- ✅ Role assignment
- ✅ Login button/link
- ✅ Security warning to change password
- ✅ Getting started instructions

## 📋 API Response Format

When creating a teacher or team member, the API returns:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "userId": "TCH-K7M2N3P4-A1B2C3",
  "role": "teacher",
  "emailSent": true,
  "message": "Teacher created and credentials sent via email",
  "createdAt": "2026-01-07T03:45:00.000Z"
}
```

**Note**: The `password` field is never returned in the response for security.

## 🔒 Security Features

### 1. **Password Hashing**
- All passwords are hashed using bcrypt (10 salt rounds)
- Original passwords are never stored in plain text
- Only the hashed version is saved to database

### 2. **Unique User IDs**
- Format: `{PREFIX}-{TIMESTAMP}-{RANDOM}`
- Prefixes: `TCH` (Teacher), `SLS` (Sales), `TLD` (Team Leader)
- Prevents ID collisions and easy identification

### 3. **Password Complexity**
Generated passwords include:
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)
- Total length: 12 characters

### 4. **Password Change Tracking**
- `passwordChanged` field tracks if user has changed their temporary password
- Can be used to force password change on first login

## 🛠️ Troubleshooting

### Email Not Sending

**Check 1: Verify .env Configuration**
```bash
# In Backend folder
cat .env
# Ensure EMAIL_USER and EMAIL_PASSWORD are set correctly
```

**Check 2: Check Backend Logs**
```bash
# Look for email sending errors in terminal
# Should see: "Email sent: <message-id>"
# Or: "Error sending email: <error message>"
```

**Check 3: Test SMTP Connection**
```javascript
// Create test file: Backend/test-email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Server is ready to send emails');
  }
});
```

Run: `node test-email.js`

### Gmail Blocking Emails

**Solution 1**: Use App Password (see Gmail Setup above)

**Solution 2**: Enable "Less secure app access"

**Solution 3**: Check Gmail security alerts
- Go to https://myaccount.google.com/notifications
- Look for blocked sign-in attempts
- Click "Yes, it was me" to allow

### Email Goes to Spam

**Solution**:
1. Add sender email to contacts
2. Mark email as "Not Spam"
3. For production: Set up SPF, DKIM, and DMARC records

## 📊 Database Schema Updates

### Teacher Model
```javascript
{
  name: String,
  email: String,
  phone: String,
  // ... other fields
  userId: String,           // NEW: Unique user ID
  password: String,         // NEW: Hashed password
  passwordChanged: Boolean  // NEW: Password change status
}
```

### TeamMember Model
```javascript
{
  name: String,
  email: String,
  phone: String,
  role: String,
  // ... other fields
  userId: String,           // NEW: Unique user ID
  password: String,         // NEW: Hashed password
  passwordChanged: Boolean  // NEW: Password change status
}
```

## 🎨 Email Template Customization

To customize email templates, edit:
`Backend/src/config/email.js`

### Change Colors
```javascript
// Find in emailTemplates.teamMemberCredentials
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
// Change to your brand colors
```

### Change Logo/Branding
```javascript
// Add logo in header section
<div class="header">
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="max-width: 150px;">
  <h1>🌙 Welcome to Quran Academy CRM</h1>
</div>
```

### Add Custom Content
```javascript
// Add sections in the content div
<div class="content">
  <h2>Custom Section</h2>
  <p>Your custom content here...</p>
</div>
```

## 🚀 Production Deployment

### Environment Variables
Set these in your hosting platform (Heroku, Railway, etc.):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-production-password
EMAIL_FROM_NAME=Quran Academy CRM
FRONTEND_URL=https://your-production-domain.com
```

### Best Practices
1. Use a dedicated email account (e.g., noreply@yourdomain.com)
2. Set up SPF and DKIM records for your domain
3. Monitor email delivery rates
4. Implement email queue for high volume
5. Add email templates to a database for easy updates

## 📝 Summary

✅ **What's Working:**
- Automatic password generation
- Unique user ID creation
- Email sending with beautiful templates
- Secure password hashing
- Error handling and logging

✅ **What You Need to Do:**
1. Update `Backend/.env` with email credentials
2. Restart backend server
3. Test by creating a teacher/team member
4. Check your email inbox

✅ **Next Steps:**
- Implement password change functionality
- Add "Forgot Password" feature
- Create email logs/history
- Add email templates for other notifications

---

**Need Help?** Check the troubleshooting section or contact your system administrator.
