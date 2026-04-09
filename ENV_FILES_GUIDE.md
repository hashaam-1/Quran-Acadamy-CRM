# 📁 Environment Files Guide

## Overview

Your project has **5 `.env` files** - this is **CORRECT** and follows best practices!

```
QuranAcademyCRM/
├── Backend/
│   ├── .env                        ← Your actual secrets (gitignored)
│   ├── .env.example                ← Template for local dev
│   └── .env.production.example     ← Template for Railway
└── Frontend/
    ├── .env                        ← Your actual API URL (gitignored)
    └── .env.example                ← Template showing format
```

---

## 🔐 Backend Environment Files

### 1. `.env` (Local Secrets - GITIGNORED)

**Purpose:** Your actual credentials for local development  
**Committed to Git:** ❌ NO (automatically ignored)  
**Used When:** Running backend locally on your computer

**Example Content:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quran_academy_crm
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hashaamamz1@gmail.com
EMAIL_PASSWORD=ydkgtsyvmdoxdvjx
EMAIL_FROM_NAME=Quran Academy CRM
```

**⚠️ NEVER commit this file to Git!**

---

### 2. `.env.example` (Local Template - COMMITTED)

**Purpose:** Shows what variables are needed for local development  
**Committed to Git:** ✅ YES  
**Used When:** Other developers clone your project

**How to Use:**
1. New developer clones the repo
2. Copies `.env.example` to `.env`
3. Fills in their own values
4. Starts developing

**Example Content:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quran_academy_crm
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Quran Academy CRM
```

---

### 3. `.env.production.example` (Production Template - COMMITTED)

**Purpose:** Shows what variables are needed for Railway deployment  
**Committed to Git:** ✅ YES  
**Used When:** Deploying to Railway or other production platforms

**How to Use:**
1. Open Railway dashboard
2. Go to Variables tab
3. Copy each variable from this file
4. Paste into Railway (with real values)

**Example Content:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db
FRONTEND_URL=https://your-frontend-url.netlify.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your16charapppassword
EMAIL_FROM_NAME=Quran Academy CRM
```

**⚠️ Important:** Railway doesn't use `.env` files - you add variables in the dashboard!

---

## 🎨 Frontend Environment Files

### 1. `.env` (API URL - GITIGNORED)

**Purpose:** Your actual API endpoint  
**Committed to Git:** ❌ NO  
**Used When:** Building frontend for deployment

**Example Content:**
```env
VITE_API_URL=https://quran-acadamy-crm-production.up.railway.app/api
```

**For Local Development:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 2. `.env.example` (Frontend Template - COMMITTED)

**Purpose:** Shows what API URL format is needed  
**Committed to Git:** ✅ YES  
**Used When:** Other developers need to know the API URL format

**Example Content:**
```env
# For Local Development
# VITE_API_URL=http://localhost:5000/api

# For Production
VITE_API_URL=https://quran-acadamy-crm-production.up.railway.app/api
```

---

## 🚀 Deployment Workflows

### Local Development

1. **Backend:**
   - Use `Backend/.env` with local MongoDB
   - Run: `npm run dev`

2. **Frontend:**
   - Use `Frontend/.env` pointing to `http://localhost:5000/api`
   - Run: `npm run dev`

### Production Deployment

1. **Backend (Railway):**
   - Don't use `.env` files
   - Add variables in Railway dashboard
   - Railway auto-deploys on git push

2. **Frontend (Netlify):**
   - Use `Frontend/.env` pointing to Railway URL
   - Build: `npm run build`
   - Deploy: `netlify deploy --prod --dir=dist`

---

## ✅ What You Should Have

### In Git (Committed):
- ✅ `Backend/.env.example`
- ✅ `Backend/.env.production.example`
- ✅ `Frontend/.env.example`

### Not in Git (Gitignored):
- ✅ `Backend/.env` (your local secrets)
- ✅ `Frontend/.env` (your API URL)

### In Railway Dashboard:
- ✅ All variables from `.env.production.example`

---

## 🔧 Common Tasks

### Adding a New Environment Variable

1. **Add to your local `.env`** (for testing)
2. **Add to `.env.example`** (for other developers)
3. **Add to `.env.production.example`** (for documentation)
4. **Add to Railway dashboard** (for production)
5. **Commit the example files** to git

### Switching Between Local and Production

**Frontend `.env`:**
```env
# Local backend
VITE_API_URL=http://localhost:5000/api

# Production backend (comment out local, uncomment this)
# VITE_API_URL=https://quran-acadamy-crm-production.up.railway.app/api
```

Then rebuild: `npm run build`

---

## 🐛 Troubleshooting

### "Email not working in production"
- ✅ Check Railway Variables tab has EMAIL_* variables
- ✅ Verify no spaces in EMAIL_PASSWORD
- ✅ Check Railway logs for errors

### "Frontend can't connect to backend"
- ✅ Check `Frontend/.env` has correct Railway URL
- ✅ Rebuild frontend: `npm run build`
- ✅ Redeploy to Netlify

### "New developer can't run project"
- ✅ Ensure `.env.example` files are committed
- ✅ Add setup instructions in README
- ✅ Tell them to copy `.env.example` to `.env`

---

## 📊 Current Status

| File | Exists | Correct | Action Needed |
|------|--------|---------|---------------|
| `Backend/.env` | ✅ | ✅ | None (local use only) |
| `Backend/.env.example` | ✅ | ✅ | Commit to git |
| `Backend/.env.production.example` | ✅ | ✅ | Commit to git |
| `Frontend/.env` | ✅ | ✅ | Rebuild after changes |
| `Frontend/.env.example` | ✅ | ✅ | Commit to git |
| Railway Variables | ❓ | ❓ | **ADD EMAIL_* VARIABLES** |

---

## 🎯 Next Steps

1. ✅ Commit the cleaned-up `.example` files:
   ```bash
   git add Backend/.env.example Backend/.env.production.example Frontend/.env.example
   git commit -m "Update env example files with proper format"
   git push
   ```

2. ⚠️ **CRITICAL:** Add email variables to Railway dashboard:
   - EMAIL_HOST=smtp.gmail.com
   - EMAIL_PORT=587
   - EMAIL_USER=hashaamamz1@gmail.com
   - EMAIL_PASSWORD=ydkgtsyvmdoxdvjx
   - EMAIL_FROM_NAME=Quran Academy CRM
   - FRONTEND_URL=https://your-netlify-url.netlify.app

3. ✅ Rebuild and redeploy frontend:
   ```bash
   cd Frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

---

**Summary:** You have the correct number of `.env` files! Just need to add the email variables to Railway dashboard.
