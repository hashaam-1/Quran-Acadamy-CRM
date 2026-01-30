# 🧪 TEST EMAIL FUNCTIONALITY

## ✅ Backend Restarted with Email Config

The backend server has been restarted and is now running with your email credentials:
- **Email**: hashaamamz1@gmail.com
- **App Password**: ydkg tsyv mdox dvjx
- **SMTP**: smtp.gmail.com:587

---

## 🧪 How to Test Email Sending

### Step 1: Create a Test Teacher
```
1. Open http://localhost:8080/teachers
2. Click "Add Teacher" button
3. Fill in the form:
   - Name: Test Teacher
   - Email: YOUR_EMAIL@gmail.com (use YOUR email to receive the test)
   - Phone: +1234567890
   - Title: Test Instructor
   - Specialization: Select any courses (Hifz, Tajweed, etc.)
4. Click "Add Teacher"
```

### Step 2: Check Backend Console
After clicking "Add Teacher", check your backend terminal for:
```
✅ Email sent: <message-id>
```
OR
```
❌ Error sending email: [error details]
```

### Step 3: Check Your Email Inbox
1. Open the email inbox you entered in the form
2. Check for email from: "Quran Academy CRM <hashaamamz1@gmail.com>"
3. Subject: "Welcome to Quran Academy CRM - Your Account Details"
4. Email should contain:
   - User ID (format: TCH-XXXXXXXX-XXXXXX)
   - Temporary Password (12 characters)
   - Login URL: http://localhost:8080

### Step 4: Check Spam Folder
If you don't see the email in inbox, check your spam/junk folder.

---

## 🔍 What the Backend Does

When you create a teacher, the backend automatically:

1. **Generates Credentials**:
   ```javascript
   userId: "TCH-A1B2C3D4-E5F6G7"  // Unique ID
   password: "Abc123XyzDef"        // Random 12-char password
   ```

2. **Hashes Password**:
   ```javascript
   hashedPassword = bcrypt.hash(password, 10)
   // Stored in database (secure)
   ```

3. **Saves to MongoDB**:
   ```javascript
   Teacher saved with:
   - All form data
   - userId
   - hashed password
   - passwordChanged: false
   ```

4. **Sends Email**:
   ```javascript
   sendEmail({
     to: teacher.email,
     subject: "Welcome to Quran Academy CRM",
     html: emailTemplate
   })
   ```

5. **Returns Response**:
   ```json
   {
     "_id": "...",
     "name": "Test Teacher",
     "email": "test@gmail.com",
     "emailSent": true,
     "message": "Teacher created and credentials sent via email"
   }
   ```

---

## 🔧 Troubleshooting

### If Email Doesn't Send:

#### Check Backend Console
Look for error messages like:
- `Error sending email: Invalid login`
- `Error sending email: Connection timeout`
- `Error sending email: Authentication failed`

#### Common Issues:

**1. App Password Incorrect**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: Verify app password is exactly: `ydkg tsyv mdox dvjx`

**2. Gmail Blocking**
```
Error: Connection timeout
```
**Solution**: 
- Check if Gmail account has 2-Step Verification enabled
- Verify App Password is generated correctly
- Try generating a new App Password

**3. Recipient Email Invalid**
```
Error: Recipient address rejected
```
**Solution**: Use a valid email address in the teacher form

**4. SMTP Connection Failed**
```
Error: connect ECONNREFUSED
```
**Solution**: Check internet connection and firewall settings

---

## 📧 Email Template Preview

The teacher will receive this email:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    QURAN ACADEMY CRM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear Test Teacher,

Welcome to Quran Academy CRM! Your account has been created successfully.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID: TCH-A1B2C3D4-E5F6G7
Temporary Password: Abc123XyzDef

Login URL: http://localhost:8080
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT: Please change your password after your first login.

Getting Started:
1. Visit the login page using the URL above
2. Enter your User ID and temporary password
3. Change your password immediately for security
4. Complete your profile information

If you have any questions, please contact the administrator.

Best regards,
Quran Academy CRM Team
```

---

## ✅ Expected Results

### Success Response in UI:
```
✅ Toast: "Teacher created successfully"
```

### Success in Backend Console:
```
Email sent: <1234567890.abcdef@smtp.gmail.com>
```

### Success in Database:
```javascript
{
  "_id": ObjectId("..."),
  "name": "Test Teacher",
  "email": "test@gmail.com",
  "userId": "TCH-A1B2C3D4-E5F6G7",
  "password": "$2a$10$...", // Hashed
  "passwordChanged": false,
  "createdAt": "2026-01-07T04:30:00.000Z"
}
```

### Success in Email Inbox:
```
📧 New email received
From: Quran Academy CRM <hashaamamz1@gmail.com>
Subject: Welcome to Quran Academy CRM - Your Account Details
```

---

## 🎯 Quick Test Steps

1. **Backend Running?** ✅ Yes (port 5000)
2. **Email Config Loaded?** ✅ Yes (restarted with new .env)
3. **Create Teacher** → Go to http://localhost:8080/teachers
4. **Enter YOUR email** → So you can verify receipt
5. **Click Save** → Watch backend console
6. **Check Email** → Should arrive within 1-2 minutes

---

## 📝 Notes

- Email sending happens **automatically** when creating teachers
- No manual action needed
- Email is sent **after** teacher is saved to database
- If email fails, teacher is still created (check `emailSent: false` in response)
- Backend logs will show email success/failure

---

**Status**: 🔄 Ready to test - Create a teacher and check your email!
