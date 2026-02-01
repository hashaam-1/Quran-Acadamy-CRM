# Deployment Guide - Quran Academy CRM

## Issues Fixed for Deployment

### ✅ Backend Fixes Applied:
1. **CORS Configuration** - Updated to support deployed frontend URLs
2. **Team Member Controller** - Fixed syntax errors in exports
3. **Request Body Limits** - Increased to 10mb for larger payloads
4. **Environment Variables** - Added proper FRONTEND_URL support

---

## Deployment Steps

### 1. Backend Deployment (Railway/Render)

#### A. Prepare Backend for Deployment

**Environment Variables to Set:**
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://h3115428731_db_user:i9mlTTAKHIqoEBfr@mohcapital.cag32bp.mongodb.net/quran_academy_crm?retryWrites=true&w=majority&appName=quran_academy_crm
FRONTEND_URL=https://your-frontend-url.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Quran Academy CRM
```

#### B. Deploy to Railway

1. **Push code to GitHub** (if not already)
   ```bash
   cd Backend
   git add .
   git commit -m "Fix deployment issues"
   git push
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `Backend` folder as root directory

3. **Set Environment Variables**
   - In Railway dashboard → Variables
   - Add all environment variables listed above
   - **IMPORTANT**: Update `FRONTEND_URL` with your actual Vercel URL

4. **Deploy**
   - Railway will auto-deploy
   - Copy the generated backend URL (e.g., `https://your-backend.railway.app`)

---

### 2. Frontend Deployment (Vercel)

#### A. Create `.env.production` file

```bash
cd Frontend
```

Create `.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

**Replace** `your-backend.railway.app` with your actual Railway backend URL.

#### B. Deploy to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add production environment"
   git push
   ```

2. **Create Vercel Project**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select `Frontend` as root directory

3. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend.railway.app/api`

5. **Deploy**
   - Click "Deploy"
   - Copy the generated frontend URL

#### C. Update Backend with Frontend URL

1. Go back to Railway dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy backend

---

## Verification Checklist

After deployment, verify these work:

### ✅ Backend Health Check
- Visit: `https://your-backend.railway.app/api/health`
- Should return: `{"status":"OK","message":"Quran Academy CRM API is running"}`

### ✅ Frontend Access
- Visit: `https://your-frontend.vercel.app`
- Should load the login page

### ✅ Login Test
- Try logging in with admin credentials
- Email: `hashaamamz1@gmail.com`
- Password: `hashaam@123`

### ✅ Add Student Test
1. Login as admin
2. Go to Students page
3. Click "Add Student"
4. Fill form and submit
5. Should successfully create student

### ✅ Add Team Member Test
1. Login as admin
2. Go to Team Management page
3. Click "Add Team Member"
4. Fill form and submit
5. Should successfully create team member

---

## Common Deployment Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: "Access to fetch has been blocked by CORS policy"

**Solution**:
- Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Redeploy backend after updating environment variable

### Issue 2: API Not Found (404)
**Symptom**: All API calls return 404

**Solution**:
- Check `VITE_API_URL` in Vercel environment variables
- Ensure it includes `/api` at the end
- Example: `https://backend.railway.app/api` (not just `https://backend.railway.app`)

### Issue 3: Database Connection Failed
**Symptom**: "MongoDB connection error" in Railway logs

**Solution**:
- Verify `MONGODB_URI` is correctly set in Railway
- Check MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere

### Issue 4: Students/Team Members Not Adding
**Symptom**: Form submits but nothing happens

**Solution**:
- Check browser console for errors
- Check Railway logs for backend errors
- Verify the syntax errors in `teamMemberController.js` are fixed
- Ensure request body size limit is set (already fixed in server.js)

---

## MongoDB Atlas Network Access

**IMPORTANT**: Allow Railway to connect to MongoDB

1. Go to MongoDB Atlas dashboard
2. Navigate to: **Network Access**
3. Click: **Add IP Address**
4. Select: **Allow Access from Anywhere** (0.0.0.0/0)
5. Click: **Confirm**

---

## Testing Deployment

### Quick Test Commands

**Test Backend Health:**
```bash
curl https://your-backend.railway.app/api/health
```

**Test Backend Students Endpoint:**
```bash
curl https://your-backend.railway.app/api/students
```

**Test Frontend API Connection:**
- Open browser DevTools (F12)
- Go to Network tab
- Login to your deployed frontend
- Check if API calls are going to the correct backend URL

---

## Files Modified for Deployment

### Backend:
- ✅ `src/server.js` - Updated CORS and body limits
- ✅ `src/controllers/teamMemberController.js` - Fixed syntax errors
- ✅ `.env.production.example` - Created production environment template

### Frontend:
- ✅ No changes needed - already configured for deployment

---

## Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend build errors
3. Check browser console for frontend runtime errors
4. Verify all environment variables are set correctly

---

## Summary

**What was fixed:**
1. ✅ CORS configuration for production
2. ✅ Team member controller syntax errors
3. ✅ Request body size limits
4. ✅ Environment variable handling

**Your deployment should now work for:**
- ✅ Adding students
- ✅ Adding team members
- ✅ All other CRUD operations
- ✅ Login/authentication
- ✅ Data fetching and display

Deploy with confidence! 🚀
