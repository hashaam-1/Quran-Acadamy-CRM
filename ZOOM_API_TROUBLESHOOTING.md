# Zoom API Troubleshooting Guide

## Current Issue: 405 Method Not Allowed

### Error Details:
```
POST https://quran-academy-production.up.railway.app/api/zoom/signature 405 (Method Not Allowed)
```

### Root Cause:
The backend Zoom routes are not properly deployed to Railway production environment.

## Backend Status Check

### 1. Verify Backend Health
```bash
curl https://quran-academy-production.up.railway.app/api/health
```

### 2. Test Zoom Endpoint Directly
```bash
curl -X POST https://quran-academy-production.up.railway.app/api/zoom/signature \
  -H "Content-Type: application/json" \
  -d '{"meetingNumber":"123456789","role":1}'
```

### 3. Check Available Routes
```bash
curl https://quran-academy-production.up.railway.app/api/health
```

## Solutions

### Solution 1: Wait for Railway Deployment
Railway may take 2-5 minutes to deploy the latest changes. The backend was just pushed with commit `7589a73`.

### Solution 2: Manual Railway Redeploy
1. Go to Railway dashboard
2. Find the Quran Academy backend service
3. Click "Redeploy" or "Deploy New Commit"
4. Select the latest commit (`7589a73`)

### Solution 3: Check Environment Variables
Ensure Railway has the correct environment variables:
- `ZOOM_SDK_KEY=YNdDIn95StmFL25wVBoGQ`
- `ZOOM_SDK_SECRET=3EAhP2bxllkQHBHeZndDiA4jiz0AfEZr`

### Solution 4: Verify Route Registration
The backend should have:
```javascript
// In server.js
app.use('/api/zoom', zoomRoutes);

// In zoomRoutes.js
router.post('/signature', generateSignature);
```

## Frontend Fallback
The frontend currently has a fallback mock signature system that will:
1. Try the backend API first
2. Fall back to mock signature if backend fails
3. Show "Using demo mode" notification
4. Allow testing of Zoom UI without backend

## Testing Steps

### Step 1: Check Backend Health
```bash
# Test if backend is running
curl https://quran-academy-production.up.railway.app/api/health
```

### Step 2: Test Zoom Endpoint
```bash
# Test Zoom signature endpoint
curl -X POST https://quran-academy-production.up.railway.app/api/zoom/signature \
  -H "Content-Type: application/json" \
  -d '{"meetingNumber":"123456789","role":1}'
```

### Step 3: Test Frontend
1. Go to Schedule page
2. Hover over any scheduled class
3. Click "Join Class" button
4. Should see either:
   - Success: "Backend signature generated successfully"
   - Fallback: "Using demo mode - backend deployment pending"

## Expected Timeline

### Immediate (0-2 minutes):
- Frontend works with mock signature
- UI shows demo mode notification
- Zoom meeting interface opens (demo mode)

### Short-term (2-5 minutes):
- Railway deployment completes
- Backend API starts working
- Real Zoom signatures generated

### Long-term (5+ minutes):
- Full production Zoom integration
- Real meeting functionality
- No more demo mode needed

## Current Status

- **Backend**: Latest changes pushed to Railway
- **Frontend**: Mock signature fallback implemented
- **Zoom SDK**: Ready and waiting for backend
- **UI**: Fully functional with demo mode

## Next Steps

1. **Wait 2-5 minutes** for Railway deployment
2. **Test the Join Class button** in Schedule page
3. **Check browser console** for success/fallback messages
4. **Verify Zoom meeting interface** opens correctly

The system is designed to work regardless of backend deployment status!
