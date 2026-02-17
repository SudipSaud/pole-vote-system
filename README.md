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
