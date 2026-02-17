# RealTime Polls - Secure Polling System

A modern, real-time polling application with enterprise-grade security protections, responsive UI, and WebSocket-based live updates.

## 🚀 Features

### Core Functionality
- ✅ Create polls with custom options
- ✅ Real-time vote counting with WebSocket
- ✅ Beautiful, responsive UI with modern design
- ✅ Live countdown timer for poll expiration
- ✅ Share polls via link

### Security Features
- 🔒 **4 Voting Security Modes:**
  - **Device Fingerprint** (Recommended): One vote per device, survives cache clearing using IP+Language hash
  - **IP Address**: Blocks all votes from same IP/Network
  - **Browser Session**: One vote per browser session only
  - **None**: Allow unlimited votes

- 🛡️ **Anti-Abuse Protections:**
  - Rate limiting (5 requests per minute per IP)
  - HMAC-SHA256 voter verification
  - UNIQUE database constraints
  - Cross-browser voting prevention

### Advanced Features
- ⏱️ **Poll Expiration**: Set custom duration in minutes, hours, or days
- 📊 **Live Results**: Real-time chart updates via WebSocket
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Modern UI**: Gradient cards, smooth animations, dark mode
- 🔄 **WebSocket Support**: Live polling results in real-time

---

## 📋 System Requirements

### Backend
- Python 3.10+
- PostgreSQL 12+
- FastAPI 0.109.0
- SQLAlchemy 2.0.25+

### Frontend
- Node.js 18+
- Next.js 14.1.0
- TypeScript
- React 18+

---

## 🏗️ Project Structure

```
poll_vote_system/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── api/               # API endpoints (polls, votes)
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Business logic layer
│   │   ├── db/                # Database configuration
│   │   └── websocket/         # WebSocket management
│   ├── requirements.txt        # Python dependencies
│   ├── run_migration.py        # Database migration runner
│   └── .env                    # Environment variables
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   ├── components/            # Reusable React components
│   ├── lib/                   # API client & utilities
│   ├── package.json           # Node dependencies
│   └── .env.local             # Frontend env variables
│
├── database/                  # Database files
│   ├── schema.sql             # Initial schema creation
│   └── migrations/            # Migration scripts
│
└── README.md                  # This file
```

---

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd poll_vote_system
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env file with your database credentials
# Example:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/polldb

# Create database (if not exists)
# psql -U postgres -c "CREATE DATABASE polldb;"

# Run migrations
python run_migration.py

# Start backend server (development)
python -m uvicorn app.main:app --reload --port 8000

# Server runs on: http://localhost:8000
```

### 3. Frontend Setup

```bash
# In separate terminal, go to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Create .env.local file:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev

# Frontend runs on: http://localhost:3000
```

### 4. Database Setup

```bash
# Using PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE polldb;

# Run migrations (from backend directory)
# Windows:
psql -U postgres -d polldb -f "database\migrations\add_poll_expiration.sql"

# Mac/Linux:
psql -U postgres -d polldb -f database/migrations/add_poll_expiration.sql
```

---

## 🔌 API Endpoints

### Polls
- `POST /polls/` - Create a new poll
- `GET /polls/` - List all polls (paginated)
- `GET /polls/{poll_id}` - Get poll details
- `DELETE /polls/{poll_id}` - Delete a poll

### Votes
- `POST /votes/{poll_id}` - Submit vote
- `GET /votes/{poll_id}/results` - Get vote results

### WebSocket
- `WS /ws/polls/{poll_id}` - Real-time updates

---

## 🎨 UI Components

### Frontend Components
- **PollForm**: Create new polls with security options
- **VoteOptions**: Vote buttons with styling
- **ResultChart**: Recharts-based vote visualization
- **PollPage**: Full poll detail and voting page

### Design Features
- 🎨 Green gradient accent color (#22c55e)
- 🌓 Dark theme optimized for readability
- 📱 Mobile-responsive layout
- ✨ Smooth animations and transitions
- 🔄 Real-time WebSocket updates

---

## 🗄️ Database Schema

### Polls Table
```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY,
    question TEXT NOT NULL,
    voting_security VARCHAR(32) DEFAULT 'ip_address',
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NULL,  -- Poll expiration time
    CONSTRAINT check_security CHECK (voting_security IN ('none', 'browser_session', 'ip_address', 'device_fingerprint'))
);
```

### Options Table
```sql
CREATE TABLE options (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0
);
```

### Votes Table
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,  -- Hashed voter identifier
    created_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_voter_per_poll UNIQUE (poll_id, voter_hash)
);
```

---

## 🔐 Security Implementation

### Device Fingerprinting
- Combines: IP Address + Language header
- Hashed: SHA256(IP:Language:Poll_ID)
- **Persists across:** Browser cache clear, incognito mode
- **Works across:** All browsers on same device

### Vote Uniqueness
- Database UNIQUE constraint on (poll_id, voter_hash)
- Prevents SQL-level duplicates
- Rate limiting at API layer

### API Protection
- CORS enabled for frontend only
- Rate limiting: 5 requests/minute per IP
- HTTPS recommended for production

---

## 🚀 Deployment Guide

### Best Free & Fast Options

#### Option 1: Railway.app (Recommended)
**Cost:** Free tier available (5GB/month)  
**Setup Time:** 5 minutes  
**Best for:** Full-stack apps with database

```bash
# 1. Sign up at railway.app
# 2. Create new project
# 3. Add PostgreSQL template
# 4. Connect GitHub repo
# 5. Auto-deploy on git push

# Environment variables needed:
# DATABASE_URL (auto-generated)
# NEXT_PUBLIC_API_URL
```

#### Option 2: Vercel + Supabase
**Frontend Cost:** Free (Vercel)  
**Database Cost:** Free tier (Supabase)  
**Setup Time:** 10 minutes

```bash
# Frontend: Deploy on Vercel (connected to GitHub)
# Backend: Can use Vercel Functions
# Database: Use Supabase (PostgreSQL hosting)
```

#### Option 3: Heroku + Heroku Postgres (Free Alternative: Render)
**Cost:** Free tier ended, but Render.com is free  
**Setup Time:** 10 minutes

```bash
# 1. Sign up at render.com
# 2. Create Web Service from GitHub
# 3. Add PostgreSQL database service
# 4. Set environment variables
# 5. Deploy
```

#### Option 4: Docker + Free Cloud Platform
**Recommended:** Railway or Render with Docker

```dockerfile
# Backend Dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📊 Comparison: Deployment Platforms

| Platform | Frontend | Backend | Database | Cost | Setup Time |
|----------|----------|---------|----------|------|-----------|
| **Railway** | ✅ | ✅ | ✅ | Free tier | 5 min |
| **Vercel + Supabase** | ✅ | Via Functions | ✅ | Free | 10 min |
| **Render** | ✅ | ✅ (Free) | ✅ (Free) | Free | 10 min |
| **Railway (Full Stack)** | ✅ | ✅ | ✅ | Free tier | 5 min |

### Recommended: Railway.app
- Simplest all-in-one solution
- Free tier generous (5GB/month)
- Native PostgreSQL support
- One-click deployments
- Perfect for this project size

---

## 🔧 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/polldb
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production
```
# Backend
DATABASE_URL=postgresql://user:password@production-host/polldb
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 👨‍💻 Development Workflow

### Running Locally
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # or Windows: venv\Scripts\activate
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Testing a Poll
1. Open http://localhost:3000
2. Click "Create Poll"
3. Enter question, options, duration (e.g., 5 minutes)
4. Choose security mode
5. Submit
6. You'll see countdown timer
7. Open in different browser/device to test security

### Database Access
```bash
# Connect to database
psql -U postgres -d polldb

# View polls
SELECT id, question, expires_at FROM polls;

# View votes
SELECT poll_id, voter_hash, COUNT(*) as count FROM votes GROUP BY poll_id, voter_hash;
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: `duration_minutes` field not recognized**
- Solution: Restart backend server after code changes

**Error: `expires_at` is NULL in database**
- Cause: Using naive datetime instead of timezone-aware
- Solution: Already fixed - using `datetime.now(timezone.utc)`

**Error: WebSocket connection failed**
- Solution: Check CORS settings, verify WebSocket URL

### Frontend Issues

**Error: "Failed to fetch polls"**
- Solution: Verify `NEXT_PUBLIC_API_URL` in .env.local
- Check backend is running on correct port

**Error: Countdown timer not updating**
- Solution: Check browser console for errors
- Verify `expires_at` is returned by API

### Database Issues

**Error: `poll_id` not found**
- Solution: Run migrations: `python run_migration.py`

**Error: Connection refused**
- Solution: Verify PostgreSQL is running
- Check `DATABASE_URL` in .env

---

## 📚 Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI | 0.109.0 |
| ORM | SQLAlchemy | 2.0.25+ |
| Database | PostgreSQL | 12+ |
| Validation | Pydantic | 2.5.3 |
| Frontend | Next.js | 14.1.0 |
| UI Library | React | 18+ |
| Charts | Recharts | 2.10.3 |
| Styling | CSS Modules | - |
| Real-time | WebSocket | - |
| Rate Limiting | slowapi | - |

---

## 📝 Code Quality

- ✅ Type hints throughout (Python + TypeScript)
- ✅ Clean code structure (separation of concerns)
- ✅ No debug logs in production code
- ✅ Proper error handling
- ✅ Database migrations for schema changes
- ✅ CORS security configured
- ✅ Input validation (Pydantic)

---

## 🎯 Future Enhancements

- [ ] Authentication & user accounts
- [ ] Poll analytics dashboard
- [ ] Export results to CSV/PDF
- [ ] Custom poll themes
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced security: 2FA voting
- [ ] Poll scheduling & automation

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects

---

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API endpoints documentation
3. Check console logs (frontend) and terminal (backend)

---

## ⚡ Performance Tips

- **Database**: Add indexes on frequently queried columns
- **Frontend**: Enable image optimization in Next.js
- **Backend**: Use connection pooling for PostgreSQL
- **WebSocket**: Keep message size minimal
- **Caching**: Enable HTTP caching headers

---

**Last Updated**: February 17, 2026  
**Version**: 1.0.0 - Production Ready
