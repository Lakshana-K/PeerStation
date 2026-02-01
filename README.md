# PeerStation
FWEB Module Assignment Submission

# Additional Feature: DevOps & GitOps Implementation

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Why This Feature?](#why-this-feature)
3. [Research Process](#research-process)
4. [Implementation Steps](#implementation-steps)
5. [Technical Architecture](#technical-architecture)
6. [How It Works](#how-it-works)
7. [Integration with Project](#integration-with-project)
8. [Challenges & Solutions](#challenges--solutions)

---

## Feature Overview

**Feature Name**: DevOps & GitOps - Automated CI/CD Pipeline

**What it does**: Automatically deploys the PeerStation application to cloud platforms (Vercel for frontend, Render for backend) whenever code is pushed to GitHub, following GitOps principles where Git is the single source of truth.

**Technologies Used**:
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **Version Control**: GitHub (with automated webhooks)
- **CI/CD**: GitHub Actions (implicit through platform integrations)

---

## Why This Feature?

### Problem Statement

Before implementing DevOps/GitOps:
- ❌ Manual deployment was time-consuming and error-prone
- ❌ Risk of deploying wrong code versions
- ❌ Inconsistent environments between development and production
- ❌ Difficult to rollback if something broke
- ❌ No automated testing or validation before deployment

### Solution

With DevOps/GitOps implementation:
- ✅ **Automated Deployments**: Code pushed to GitHub automatically deploys
- ✅ **Version Control**: Git history provides complete audit trail
- ✅ **Consistency**: Same code deployed every time, no human error
- ✅ **Fast Rollback**: Revert Git commit = automatic rollback
- ✅ **Separate Environments**: Frontend and backend scale independently
- ✅ **Professional Workflow**: Industry-standard development practices

### Why It Fits PeerStation

A tutoring platform needs:
- **Reliability**: Students and tutors depend on uptime
- **Rapid Updates**: Quick bug fixes and feature additions
- **Scalability**: Handle growing user base
- **Security**: Proper environment separation and HTTPS
- **Professionalism**: Enterprise-grade infrastructure

This DevOps implementation ensures PeerStation meets all these requirements.

---

## Research Process

### 1. Understanding DevOps & GitOps Principles

**Resources Consulted**:

- **"The Twelve-Factor App" (https://12factor.net/)**
  - Learned about environment-based configuration
  - Understood importance of separating config from code
  - Applied: Used environment variables for sensitive data (API keys, database URLs)

- **GitOps Principles (https://www.gitops.tech/)**
  - Learned about declarative infrastructure
  - Understood Git as single source of truth
  - Applied: All deployments triggered by Git commits, no manual changes to production

### 2. Choosing Deployment Platforms

**Platform Research**:

**Vercel (https://vercel.com/docs)**
- **Why Chosen for Frontend**:
  - Optimized for React/Vite applications
  - Automatic HTTPS certificates
  - Global CDN for fast loading worldwide
  - Zero-configuration deployment
  - Free tier suitable for student projects
- **Key Learnings**:
  - How to configure build commands
  - Setting environment variables
  - Understanding preview deployments
  - CDN cache invalidation

**Render (https://render.com/docs)**
- **Why Chosen for Backend**:
  - Managed Node.js hosting
  - Automatic SSL certificates
  - Health checks and auto-restart
  - Close geographic proximity to MongoDB
  - Free tier with sufficient resources
- **Key Learnings**:
  - Configuring start commands
  - Setting up environment variables
  - Understanding health checks
  - Reading deployment logs

**MongoDB Atlas (https://docs.atlas.mongodb.com/)**
- **Why Chosen for Database**:
  - Fully managed cloud database
  - Automatic backups
  - Built-in security features
  - Free tier with 512MB storage
  - High availability
- **Key Learnings**:
  - Creating clusters and databases
  - Network access configuration
  - Connection string format
  - Security best practices

### 3. Technical Implementation Research

**Express.js & CORS (https://expressjs.com/)**
- Researched CORS configuration for cross-origin requests
- Learned how to allow multiple domains (localhost + production)
- Applied: Dynamic CORS based on request origin

**Mongoose Connection (https://mongoosejs.com/docs/connections.html)**
- Researched connection string format
- Learned about connection error handling
- Applied: Graceful connection with error logging

**Environment Variables (Node.js Documentation)**
- Researched dotenv package
- Learned about .env file structure
- Applied: Separate .env files for local vs production

### 4. CI/CD Pipeline Research

**GitHub Webhooks Documentation**
- Learned how webhooks notify external services
- Understood payload structure
- Applied: Connected GitHub to Vercel and Render

**Deployment Automation**
- Researched automatic vs manual deployments
- Learned about deployment triggers
- Applied: Automatic deployment on push to main branch

---

## Implementation Steps

### Step 1: GitHub Repository Setup

**Actions Taken**:
1. Created GitHub repository: `https://github.com/Lakshana-K/PeerStation`
2. Initialized with README and .gitignore
3. Pushed initial code to main branch
4. Configured branch protection (optional for solo project)

**Why This Step**:
- GitHub serves as the single source of truth (GitOps principle)
- All code changes tracked with version control
- Enables automatic deployments

---

### Step 2: MongoDB Atlas Configuration

**Actions Taken**:

1. **Created MongoDB Atlas Account** (https://www.mongodb.com/cloud/atlas)
   - Signed up for free tier

2. **Created Cluster**:
   - Cluster Name: `cluster0`
   - Region: Singapore (ap-southeast-1)
   - Tier: M0 Sandbox (Free)
   - Cloud Provider: AWS

3. **Created Database**:
   - Database Name: `peerstation_backend`
   - Collections: users, bookings, reviews, helprequests, messages, availabilities, notifications

4. **Configured Network Access**:
   - Added IP Address: `0.0.0.0/0` (allow from anywhere)
   - Why: Needed for Render and Vercel to access database

5. **Created Database User**:
   - Username: `[username]`
   - Password: `[secure password]`
   - Role: Read and write to any database

6. **Obtained Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster0.tnmu5rf.mongodb.net/peerstation_backend
   ```

**Why This Step**:
- Provides persistent cloud storage
- Automatic backups and high availability
- Accessible from both local development and production

---

### Step 3: Backend Deployment on Render

**Actions Taken**:

1. **Created Render Account** (https://render.com)

2. **Created New Web Service**:
   - Connected GitHub repository
   - Selected repository: `PeerStation`
   - Root Directory: `/`
   - Environment: Node
   - Region: Singapore
   - Branch: main

3. **Configured Build Settings**:
   ```yaml
   Build Command: npm install
   Start Command: node server/server.js
   ```

4. **Set Environment Variables** in Render Dashboard:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.tnmu5rf.mongodb.net/peerstation_backend
   FRONTEND_URL=https://peer-station.vercel.app
   NODE_ENV=production
   PORT=3001
   ```

5. **Deployed Service**:
   - Manual deploy to test
   - Verified logs showed successful connection
   - Checked API endpoint: `https://peerstation-api.onrender.com/api/users`

6. **Enabled Auto-Deploy**:
   - Configured automatic deployments on push to main
   - Tested by pushing code change

**Why This Step**:
- Provides managed Node.js hosting
- Automatic deployments save time
- Health checks ensure uptime
- Free tier sufficient for development

---

### Step 4: Frontend Deployment on Vercel

**Actions Taken**:

1. **Created Vercel Account** (https://vercel.com)

2. **Imported GitHub Project**:
   - Connected GitHub account
   - Selected repository: `PeerStation`
   - Framework Preset: Vite
   - Root Directory: `/`

3. **Configured Build Settings**:
   ```yaml
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   ```env
   VITE_API_URL=https://peerstation-api.onrender.com
   ```
   - Note: Vite requires `VITE_` prefix for environment variables

5. **Deployed Project**:
   - Initial deployment took ~45 seconds
   - Assigned URL: `https://peer-station.vercel.app`
   - Custom domain can be added later

6. **Verified Deployment**:
   - Opened website in browser
   - Tested API calls to backend
   - Confirmed CORS working correctly

7. **Enabled Auto-Deploy**:
   - Automatic deployments enabled by default
   - Tested by pushing frontend change

**Why This Step**:
- Vercel optimized for React applications
- Global CDN for fast loading
- Automatic HTTPS certificates
- Preview deployments for testing

---

### Step 5: CORS Configuration

**Problem**: Frontend (Vercel) couldn't access Backend (Render) due to cross-origin restrictions

**Solution Implemented** in `server/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',      // Local development
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL      // Production Vercel URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow ALL Vercel deployments (including preview branches)
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Check other allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Why This Configuration**:
- Allows frontend to access backend API
- Supports preview deployments (*.vercel.app wildcard)
- Blocks unauthorized origins for security
- Enables credentials for future authentication features

**Testing**:
1. Pushed code to GitHub
2. Both Vercel and Render auto-deployed
3. Tested API calls from frontend
4. Verified no CORS errors in browser console

---

### Step 6: Environment Variables Management

**Challenge**: Sensitive data (database passwords, API keys) should not be in code

**Solution**:

1. **Local Development** - Created `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0...
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   PORT=3001
   ```

2. **Production (Render)** - Set in Dashboard:
   - MONGODB_URI (same connection string)
   - FRONTEND_URL (production Vercel URL)
   - NODE_ENV=production
   - PORT (Render assigns automatically)

3. **Production (Vercel)** - Set in Dashboard:
   - VITE_API_URL (production Render URL)

4. **Added to .gitignore**:
   ```
   .env
   .env.local
   .env.production
   ```

**Why This Approach**:
- Keeps secrets out of version control
- Different settings for dev vs production
- Easy to update without code changes
- Follows 12-factor app principles

---

### Step 7: Testing the Pipeline

**Test 1: Backend Change**
1. Modified `server/routes/users.js` (added validation)
2. Committed: `git commit -m "Add email validation"`
3. Pushed: `git push origin main`
4. **Result**: Render detected change → Built → Deployed → Live in 2 minutes

**Test 2: Frontend Change**
1. Modified `src/pages/Home.jsx` (updated text)
2. Committed: `git commit -m "Update homepage text"`
3. Pushed: `git push origin main`
4. **Result**: Vercel detected change → Built → Deployed → Live in 45 seconds

**Test 3: Full Stack Change**
1. Added new API endpoint in backend
2. Updated frontend to call new endpoint
3. Committed and pushed both changes
4. **Result**: Both platforms deployed independently → Worked together seamlessly

**Test 4: Rollback**
1. Introduced bug in frontend
2. Reverted Git commit: `git revert HEAD`
3. Pushed: `git push origin main`
4. **Result**: Vercel deployed previous working version automatically

---

## Technical Architecture

### Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                        │
│                   (Single Source of Truth)                   │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ Webhook on Push            │ Webhook on Push
             ▼                            ▼
    ┌────────────────┐           ┌────────────────┐
    │     VERCEL     │           │     RENDER     │
    │   (Frontend)   │           │   (Backend)    │
    ├────────────────┤           ├────────────────┤
    │ 1. Pull Code   │           │ 1. Pull Code   │
    │ 2. npm install │           │ 2. npm install │
    │ 3. npm build   │           │ 3. Start Server│
    │ 4. Deploy CDN  │           │ 4. Health Check│
    └────────┬───────┘           └────────┬───────┘
             │                            │
             │ Serves HTML/JS             │ Serves API
             │                            │
             └──────────┬─────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │  USER BROWSER │
                └───────┬───────┘
                        │
                        │ CRUD Operations
                        ▼
                ┌───────────────┐
                │ MONGODB ATLAS │
                │  (Database)   │
                └───────────────┘
```

### Request Flow

**User Action → Response**:
```
1. User visits https://peer-station.vercel.app
   → Vercel CDN serves React app

2. React app loads in browser
   → Makes API call to https://peerstation-api.onrender.com/api/users

3. Render receives API request
   → Queries MongoDB Atlas
   → Returns JSON response

4. React receives data
   → Updates UI
   → User sees tutor list
```

### Deployment Trigger Flow

**Code Change → Live Production**:
```
Developer:
  1. Write code locally
  2. git add .
  3. git commit -m "message"
  4. git push origin main
     ↓
GitHub:
  5. Receives push
  6. Triggers webhooks
     ↓
Vercel (parallel):          Render (parallel):
  7. Pull latest code         7. Pull latest code
  8. Install dependencies     8. Install dependencies
  9. Build React app          9. Start Express server
  10. Deploy to CDN           10. Run health check
  11. Update DNS              11. Route traffic
     ↓                           ↓
Production:
  12. New version live (< 3 minutes total)
```

---

## How It Works

### 1. Continuous Integration (CI)

**What Happens on Every Push**:

```
Push to GitHub
    ↓
GitHub Webhooks Triggered
    ↓
┌───────────────┐         ┌──────────────┐
│ Vercel        │         │ Render       │
│ receives      │         │ receives     │
│ notification  │         │ notification │
└───────┬───────┘         └──────┬───────┘
        │                        │
        ▼                        ▼
    Pull Code                Pull Code
        │                        │
        ▼                        ▼
    Install Deps             Install Deps
        │                        │
        ▼                        ▼
    Run Build                Start Server
        │                        │
        ▼                        ▼
    Tests Pass?              Health Check?
    (if configured)          (automatic)
        │                        │
        ▼                        ▼
   SUCCESS ✅               SUCCESS ✅
```

### 2. Continuous Deployment (CD)

**Automatic Deployment Process**:

**Frontend (Vercel)**:
- **Trigger**: Push to main branch
- **Duration**: ~45 seconds
- **Process**:
  1. Clone repository
  2. Install dependencies
  3. Run `npm run build`
  4. Generate static files in `dist/`
  5. Upload to global CDN
  6. Update DNS records
  7. Invalidate old cache
- **Result**: New version live at https://peer-station.vercel.app

**Backend (Render)**:
- **Trigger**: Push to main branch
- **Duration**: ~2-3 minutes
- **Process**:
  1. Clone repository
  2. Install dependencies
  3. Run `node server/server.js`
  4. Connect to MongoDB
  5. Pass health check (GET /api/health)
  6. Route traffic to new instance
  7. Shut down old instance
- **Result**: New version live at https://peerstation-api.onrender.com

### 3. Environment Separation

**Why Separate Frontend and Backend?**

**Advantages**:
1. **Independent Scaling**: 
   - Frontend served from CDN (instant global access)
   - Backend runs on single server (can upgrade tier if needed)

2. **Security**:
   - Backend not directly accessible to public
   - Only API endpoints exposed
   - Database credentials never in frontend code

3. **Performance**:
   - Static files cached on CDN (faster loading)
   - API server close to database (faster queries)

4. **Cost-Effective**:
   - Vercel optimized for static sites (free tier generous)
   - Render optimized for backend (free tier includes 750 hours/month)

5. **Flexibility**:
   - Can update frontend without touching backend
   - Can update backend without redeploying frontend
   - Can use different tech stacks if needed

---

## Integration with Project

### How It Integrates with PeerStation

**Not an Isolated Feature**:
- ❌ NOT a separate page or component
- ❌ NOT disconnected from main functionality
- ✅ Deploys the ENTIRE application
- ✅ Every feature depends on it
- ✅ Enables all user interactions

**Real Impact**:

1. **User Registration/Login**:
   - Frontend form → Deployed on Vercel
   - API call → Routed through CORS to Render
   - User data → Stored in MongoDB Atlas
   - All enabled by this deployment pipeline

2. **Booking a Session**:
   - Frontend booking page → Served from Vercel CDN
   - API request → Processed by Render backend
   - Booking record → Saved to MongoDB
   - Notification → Created via deployed API

3. **Sending Messages**:
   - Frontend message interface → Deployed on Vercel
   - WebSocket/API calls → Handled by Render
   - Message data → Stored in MongoDB
   - Real-time updates → Delivered via deployed infrastructure

**Without This Feature**:
- ❌ Application only runs locally
- ❌ No one can access the platform
- ❌ No real users can be onboarded
- ❌ Cannot demonstrate to stakeholders
- ❌ Not production-ready

**With This Feature**:
- ✅ Application accessible 24/7 globally
- ✅ Real users can register and use platform
- ✅ Automatic updates with every code change
- ✅ Professional, production-ready system
- ✅ Scalable infrastructure

---

## Challenges & Solutions

### Challenge 1: CORS Errors

**Problem**:
- Frontend on `https://peer-station.vercel.app`
- Backend on `https://peerstation-api.onrender.com`
- Browser blocked requests due to different origins

**Solution**:
```javascript
// Implemented dynamic CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow Vercel domains
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
```

**Lesson Learned**: Production CORS is more restrictive than localhost

---

### Challenge 2: Environment Variables

**Problem**:
- Database password in code → Security risk
- Different URLs for dev vs production
- Hard to change without redeploying

**Solution**:
- Used `.env` files locally
- Configured environment variables in Vercel/Render dashboards
- Never committed sensitive data to Git

**Lesson Learned**: Never hardcode credentials

---

### Challenge 3: Build Failures

**Problem**:
- Render deployment failed with "Module not found"
- Issue: Dev dependencies not installed in production

**Solution**:
- Ensured all required packages in `dependencies` not `devDependencies`
- Verified `package.json` was correct
- Tested build locally before pushing

**Lesson Learned**: Test builds locally before pushing

---

### Challenge 4: MongoDB Connection

**Problem**:
- Could connect locally but not from Render
- Error: "MongoServerError: Authentication failed"

**Solution**:
- Added Render IP to MongoDB Network Access (used 0.0.0.0/0 for simplicity)
- Verified connection string format
- Checked environment variable was set correctly

**Lesson Learned**: Production environment needs network access configuration

---

### Challenge 5: Deployment Speed

**Problem**:
- Render free tier "spins down" after 15 minutes of inactivity
- First request after sleep takes 30+ seconds to wake up

**Solution**:
- Documented in README (not fixable on free tier)
- Can be solved by:
  - Upgrading to paid tier (keeps server always running)
  - Using a cron job to ping server every 10 minutes
  - Accepting cold starts as trade-off for free hosting

**Lesson Learned**: Free tier has limitations, but acceptable for development/demo

---

## Key Takeaways

### What I Learned

1. **DevOps Principles**:
   - Git as single source of truth
   - Automated deployments save time
   - Environment variables for configuration
   - Importance of monitoring and logs

2. **Cloud Platforms**:
   - Each platform has strengths (Vercel for frontend, Render for backend)
   - Free tiers are generous for student projects
   - Managed services reduce maintenance burden
   - Geographic regions matter for performance

3. **CI/CD Best Practices**:
   - Automatic deployments reduce human error
   - Rollback capability is essential
   - Testing before production is critical
   - Logs help debug deployment issues

4. **Architecture Decisions**:
   - Separating frontend and backend improves scalability
   - CDN distribution improves global performance
   - CORS configuration is crucial for security
   - Environment separation (dev vs prod) prevents issues

### Why This Feature is Valuable

**For the Project**:
- Enables real users to access the platform
- Provides professional, production-ready infrastructure
- Supports rapid iteration and bug fixes
- Scales with user growth

**For Learning**:
- Industry-standard development workflow
- Practical experience with cloud platforms
- Understanding of modern deployment practices
- Portfolio-ready professional project

**For the Future**:
- Can easily add more features
- Can upgrade hosting tiers as needed
- Can add custom domains
- Foundation for continuous improvement

---

## Conclusion

This DevOps/GitOps implementation transforms PeerStation from a local development project into a production-ready, globally accessible platform. By automating the deployment pipeline and following industry best practices, the platform can reliably serve real users while supporting rapid development and iteration.

The feature is fully integrated with the project—every line of code, every user interaction, and every database operation depends on this deployment infrastructure to function in production.

---

## Additional Resources

**Documentation Used**:
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs  
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- GitOps: https://www.gitops.tech/
- 12-Factor App: https://12factor.net/

**Project Links**:
- Live Frontend: https://peer-station.vercel.app
- Live Backend: https://peerstation-api.onrender.com
- API Docs: https://peerstation-api.onrender.com/api-docs
- GitHub: https://github.com/Lakshana-K/PeerStation

---
