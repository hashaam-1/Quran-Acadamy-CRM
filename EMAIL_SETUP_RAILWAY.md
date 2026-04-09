# Email Configuration for Railway Deployment

## Issues Fixed ✅

1. **Student emails were commented out** - Now enabled and sending asynchronously
2. **Team member resend was blocking** - Now async (non-blocking)
3. **Performance improved** - All emails send in background without slowing down API responses

## Email Configuration Required

Your backend needs email credentials to send emails. Follow these steps:

### Step 1: Set Up Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select **Mail** and **Other (Custom name)**
6. Enter "Quran Academy CRM" as the name
7. Click **Generate**
8. **Copy the 16-character password** (you'll need this)

### Step 2: Configure Railway Environment Variables

1. Go to your Railway dashboard: https://railway.app/
2. Click on your **backend service**
3. Go to the **Variables** tab
4. Add the following environment variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=Quran Academy CRM
FRONTEND_URL=https://your-frontend-url.netlify.app
```

**Important:** Replace with your actual values:
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASSWORD`: The 16-character app password from Step 1
- `FRONTEND_URL`: Your deployed frontend URL

### Step 3: Redeploy Backend

After adding environment variables:
1. Railway will automatically redeploy
2. Wait for deployment to complete
3. Check logs to verify email configuration

### Step 4: Test Email Sending

1. Create a new team member or student
2. Check the Railway logs for: `Email sent to [role]: Success`
3. Check the recipient's email inbox (including spam folder)

## Alternative Email Providers

### Using SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com/ (Free tier: 100 emails/day)
2. Create an API key
3. Update Railway variables:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Using Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## Troubleshooting

### Emails Not Being Received

1. **Check Railway Logs:**
   - Go to Railway dashboard → Your backend service → Logs
   - Look for "Email sent to [role]: Success" or error messages

2. **Check Spam Folder:**
   - Emails might be marked as spam initially

3. **Verify Environment Variables:**
   - Ensure all EMAIL_* variables are set correctly
   - No extra spaces in values

4. **Test Email Configuration:**
   - Check Railway logs for connection errors
   - Verify Gmail app password is correct (16 characters, no spaces)

### Common Errors

**Error: "Invalid login"**
- Solution: Regenerate Gmail app password and update Railway variable

**Error: "Connection timeout"**
- Solution: Check EMAIL_HOST and EMAIL_PORT are correct

**Error: "Authentication failed"**
- Solution: Ensure 2-Step Verification is enabled on Gmail

## Performance Notes

All email sending is now **asynchronous** (non-blocking):
- ✅ API responds immediately
- ✅ Emails sent in background
- ✅ No slowdown when creating users
- ✅ Better user experience

## Current Status

- ✅ Student email sending: **ENABLED**
- ✅ Team member email sending: **ENABLED**
- ✅ Teacher email sending: **ENABLED**
- ✅ Async/non-blocking: **ENABLED**
- ⚠️ Email credentials: **NEEDS CONFIGURATION IN RAILWAY**

## Next Steps

1. Set up Gmail app password (5 minutes)
2. Add environment variables to Railway (2 minutes)
3. Wait for automatic redeploy (1-2 minutes)
4. Test by creating a user and checking email

---

**Note:** Without email configuration, the system will show "Credentials sent successfully" but emails won't actually be delivered. Configure the environment variables in Railway to enable email delivery.
