# Railway Deployment Guide - Step by Step

This guide walks you through deploying your polling system on Railway.app in about 10 minutes.

---

## 📋 Prerequisites

- ✅ GitHub account with code pushed (you have this: https://github.com/SudipSaud/pole-vote-system)
- ✅ Railway account (free to create)
- ✅ Code fully committed and pushed to GitHub

---

## 🚀 Step 1: Sign Up on Railway

1. Go to **https://railway.app**
2. Click **"Start Free"** button
3. Choose **"GitHub"** to sign up with your GitHub account
4. Authorize Railway to access your GitHub repositories
5. You'll be taken to your Railway dashboard

---

## 🔧 Step 2: Create a New Project

1. Click **"New Project"** button (middle of dashboard)
2. Click **"Deploy from GitHub"**
3. Select your GitHub account if prompted
4. Search for **"pole-vote-system"** (or your repo name)
5. Click on it to select it
6. Click **"Deploy"**

Railway will now detect your project structure.

---

## ⚠️ Important: Monorepo Setup

Your project is a **monorepo** with:
- `backend/` → Python FastAPI app
- `frontend/` → Node.js Next.js app
- `database/` → Migration files

Railway will need **separate services** for each:
- Service 1: Backend (Python)
- Service 2: Frontend (Node)
- Service 3: PostgreSQL (database)

Each service needs its **Root Directory** configured in settings:
- Backend root: `backend`
- Frontend root: `frontend`

This tells Railway where to find each app's code. The steps below explain exactly how to do this.

---

## 🚨 CRITICAL: Set Root Directory FIRST

**⚠️ If you don't set Root Directory, Railpack will fail with "could not determine how to build the app"**

For EACH service you create (Backend and Frontend):
1. Go to service **Settings** tab
2. Find **"Root Directory"** field
3. Set it to either `backend` or `frontend` (depending on service)
4. **SAVE** - this is required before deployment

If you see "Error creating build plan with Railpack", you forgot this step. Go fix it!

---

## 🗄️ Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"** button
2. Select **"Database"** > **"PostgreSQL"**
3. Wait for PostgreSQL to initialize (takes ~30 seconds)

Railway automatically:
- Creates a PostgreSQL database
- Generates `DATABASE_URL` environment variable
- Connects it to your project

---

## 🔐 Step 4: Configure Backend Service

### A. Create Backend Service

1. Click **"+ New"** button in your project
2. Select **"GitHub"** 
3. Select your **"pole-vote-system"** repo again
4. Wait for the service to be created

### ⚠️ B. SET ROOT DIRECTORY IMMEDIATELY (REQUIRED FIRST!)

**Do this before anything else or deployment will fail!**

1. Click on the **"Backend"** service 
2. Go to **"Settings"** tab
3. Find **"Root Directory"** field
4. Clear any existing value and type: `backend`
5. Press Enter and **SAVE**
6. Wait for settings to update

### C. Set Environment Variables

1. Go to **"Variables"** tab
2. Add these variables:

```
CORS_ORIGINS=https://<your-railway-frontend-domain>
ENVIRONMENT=production
```

3. Railway automatically provides `DATABASE_URL` from PostgreSQL

### ⚠️ D. Set Build & Start Commands (REQUIRED!)

**CRITICAL:** Both of these MUST be set or deployment will fail with "No start command was found"

1. Go back to **"Settings"** tab
2. Find **"Build Command"** field and set it to:
```bash
pip install -r requirements.txt
```

3. Find **"Start Command"** field and set it to:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
**Important:** Make sure this field is NOT empty. You must paste the exact command above.

4. Click **"Save"** to apply settings
5. Go to **"Deployments"** tab and click **"Deploy"** 

Your backend will deploy and get a public URL like: `https://your-backend-random-id.railway.app`

---

## 🎨 Step 5: Configure Frontend Service

### A. Add Frontend Service

1. Click **"+ New"** button in your Railway project
2. Select **"GitHub"** 
3. Select your repo again
4. This adds a frontend service

### ⚠️ B. SET ROOT DIRECTORY IMMEDIATELY (REQUIRED FIRST!)

**Do this before anything else or deployment will fail!**

1. Click the **"Frontend"** service
2. Go to **"Settings"** tab
3. Find **"Root Directory"** field
4. Clear any existing value and type: `frontend`
5. Press Enter and **SAVE**
6. Wait for settings to update

### C. Set Environment Variables

1. Go to **"Variables"** tab
2. Add this environment variable:

```
NEXT_PUBLIC_API_URL=https://your-backend-random-id.railway.app
```

Replace `your-backend-random-id` with the actual backend URL from Step 4.

### D. Set Build & Start Commands

1. Go to **"Settings"** tab
2. Find **"Build Command"** and set:
```bash
npm install && npm run build
```

3. Find **"Start Command"** and set:
```bash
npm start
```

4. Click **"Deploy"** at bottom

Your frontend will deploy and get a URL like: `https://your-frontend-random-id.railway.app`

---

## 🗄️ Step 6: Run Database Migrations

Before the app works, you need to create the database tables.

### A. Access Railway PostgreSQL Console

1. Click on the **"PostgreSQL"** service in your project
2. Click **"Connect"** tab
3. Copy the connection string (looks like `postgresql://user:pass@host:port/railway`)

### B. Run Migrations

**Option 1: Using Railway CLI (requires installation)**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Connect to project
railway link

# Run migration
psql $(railway variables get DATABASE_URL) < database/migrations/add_poll_expiration.sql
```

**Option 2: Direct PostgreSQL (Recommended)**

1. Install PostgreSQL command-line tools if not installed
2. Copy the DATABASE_URL connection string from PostgreSQL service
3. Run this command in your terminal:

```bash
psql DATABASE_URL_HERE < database/migrations/add_poll_expiration.sql
```

Example:
```bash
psql postgresql://postgres:password@host.railway.internal:5432/railway < database/migrations/add_poll_expiration.sql
```

---

## ✅ Step 7: Verify Deployment

1. Go back to your Railway project dashboard
2. You should see 3 services:
   - ✅ **Backend** (Python/FastAPI) - Running
   - ✅ **Frontend** (Node/Next.js) - Running
   - ✅ **PostgreSQL** - Running

3. Click on **Frontend** service
4. Copy the public URL (something like `https://your-frontend-random-id.railway.app`)
5. Open it in your browser

You should see your polling application live! 🎉

---

## 🧪 Test the Live Application

1. Click **"Create Poll"**
2. Enter a question and options
3. Set duration (e.g., 30 minutes)
4. Choose security mode
5. Submit
6. Vote on the poll
7. Check the countdown timer working
8. Watch the live results update

---

## 🔄 Future Deployments

After your code is working:

**For Backend Changes:**
```bash
git add .
git commit -m "Backend update"
git push origin main
```
Railway will automatically redeploy the backend.

**For Frontend Changes:**
```bash
git add .
git commit -m "Frontend update"
git push origin main
```
Railway will automatically redeploy the frontend.

---

## ✅ Pre-Deployment Checklist

Before clicking "Deploy", verify these are set for EACH service:

**Backend Service:**
- [ ] Root Directory = `backend` ⚠️ **REQUIRED**
- [ ] Build Command = `pip install -r requirements.txt` ⚠️ **REQUIRED**
- [ ] Start Command = `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` 🔴 **CRITICAL - Must NOT be empty**
- [ ] Variables include: `CORS_ORIGINS`, `ENVIRONMENT`
- [ ] PostgreSQL is added to project

**Frontend Service:**
- [ ] Root Directory = `frontend` ⚠️ **REQUIRED**
- [ ] Build Command = `npm install && npm run build`
- [ ] Start Command = `npm start`
- [ ] Variables include: `NEXT_PUBLIC_API_URL` (with backend URL)

**PostgreSQL:**
- [ ] Added to project
- [ ] Initialized (shows as "Running")

---

## 🚨 Common Issues & Solutions

### 🔴 Issue: "Railpack could not determine how to build the app" Error

**Status:** Build fails with "Error creating build plan with Railpack"

**Root Cause:** Root Directory is not set for the service

**Solution - FIX THIS IMMEDIATELY:**
1. Go to the **failing service** (Backend or Frontend)
2. Click **"Settings"** tab
3. Find **"Root Directory"** field
4. If it's empty or wrong, set it to `backend` or `frontend`
5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Click **"Redeploy"** button to retry
8. Check logs - it should work now

**Prevention:** Always set Root Directory BEFORE any build commands or variables.

### Issue: "Railpack could not determine how to build the app" Error (Alternative)
**Solution:** This can also happen because Railway sees a monorepo. Fix it:
1. For each service (Backend and Frontend):
   - Go to **Settings** tab
   - Verify **Root Directory** is set correctly (`backend` or `frontend`)
   - Set the correct build/start commands (see Steps 4-5)
2. Make sure each service has its own root directory configured
3. Re-deploy each service

### 🔴 Issue: "No start command was found" Error

**Status:** Build fails with "To start your Python application, Railpack will automatically..."

**Root Cause:** Start Command field is empty in Settings

**Solution - FIX THIS IMMEDIATELY:**
1. Go to Backend service → **Settings** tab
2. Find **"Start Command"** field
3. Paste this exactly:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
4. Click **"Save"**
5. Go to **"Deployments"** tab and click **"Redeploy"**
6. Should work now

**Note:** Even though Railpack can auto-detect FastAPI, you must explicitly set the Start Command to ensure it works correctly.

### Issue: Backend deployment fails
**Solution:** Check logs in Railway dashboard. Common causes:
- Missing `requirements.txt`
- Root Directory not set to `backend`
- **Start Command is empty** (see above)
- Wrong Python version (need 3.10+)

### Issue: Frontend shows "Failed to fetch"
**Solution:** 
1. Check `NEXT_PUBLIC_API_URL` in frontend Variables
2. Ensure backend URL is correct and running
3. Check CORS settings in backend
4. Verify root directory is set to `frontend`

### Issue: Database migration fails
**Solution:**
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Try running migration separately

### Issue: Polls showing expired immediately
**Solution:** This was already fixed in your code, but if it happens:
- Check backend logs for datetime issues
- Verify expires_at column exists in database
- Re-run migrations if needed

---

## 📊 Railway Dashboard Overview

**Services View** - Shows all deployed services (Backend, Frontend, PostgreSQL)

**Logs Tab** - Shows real-time logs for debugging
- Backend logs: Python/uvicorn output
- Frontend logs: Next.js build & runtime output
- PostgreSQL logs: Database operations

**Variables Tab** - Environment variables for each service
- Backend needs: `DATABASE_URL` (auto), `CORS_ORIGINS`, `ENVIRONMENT`
- Frontend needs: `NEXT_PUBLIC_API_URL`

**Settings Tab** - Build/start commands, domains, deployments history

---

## 🎯 Your Live App URLs

After successful deployment:

- **Frontend**: `https://your-frontend-random-id.railway.app`
- **Backend API**: `https://your-backend-random-id.railway.app`
- **API Docs**: `https://your-backend-random-id.railway.app/docs`

You can share the frontend URL with others to use your polling system!

---

## 💡 Pro Tips

1. **Custom Domain**: Railway allows linking custom domains (GitHub Pro benefits)
2. **Environment**: Set `ENVIRONMENT=production` on Railway, `ENVIRONMENT=development` locally
3. **Logs**: Always check Railway dashboard logs when something goes wrong
4. **Scaling**: Free tier gives you 5GB/month - enough for ~100,000 votes
5. **Automatic Deploys**: Every git push to main triggers automatic redeployment

---

## 🎉 Congratulations!

Your polling system is now live on Railway and can be accessed from anywhere on the internet!

**Next Steps:**
- Share the frontend URL with friends
- Monitor the deployment in Railway dashboard
- Check logs if any issues occur
- Update your GitHub repo URL in documentation

---

**Questions?** Check Railway documentation: https://docs.railway.app
