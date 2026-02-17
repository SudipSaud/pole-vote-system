# ⚡ Quick Start Guide

Get the app running in 5 minutes.

## Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 12+

## 🏃 5-Minute Setup

### 1. Backend Setup (Terminal 1)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (Terminal 2)
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Open Browser
```
http://localhost:3000
```

## ✅ That's it!

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🧪 Test the App

1. **Create Poll**
   - Click "Create Poll"
   - Enter question: "What's your favorite color?"
   - Add options: "Red", "Blue", "Green"
   - Set expiry: 5 minutes
   - Click "Create Poll"

2. **Vote**
   - Choose an option
   - Vote gets counted in real-time

3. **Share**
   - Copy poll link
   - Open in different browser/incognito
   - Try voting (should be blocked by security)

4. **Monitor**
   - Backend terminal shows HTTP requests
   - Frontend console shows API calls
   - WebSocket shows real-time updates

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `backend/app/main.py` | Backend entry point |
| `backend/app/api/polls.py` | Poll API endpoints |
| `backend/app/api/votes.py` | Vote API endpoints |
| `frontend/app/page.tsx` | Home page |
| `frontend/components/PollForm.tsx` | Create poll form |
| `frontend/app/poll/[id]/page.tsx` | Vote on poll page |

---

## 🛠️ Useful Commands

### Backend
```bash
# Format code
black backend/

# Check types
mypy backend/

# Run tests
pytest backend/

# Reset database
python
>>> from app.db.database import Base, engine
>>> Base.metadata.drop_all(engine)
>>> Base.metadata.create_all(engine)
```

### Frontend
```bash
# Format code
npm run format

# Lint
npm run lint

# Build production
npm run build

# Start production build
npm start
```

### Database
```bash
# Connect to database
psql -U postgres -d polldb

# List polls
SELECT id, question, created_at FROM polls;

# List votes
SELECT * FROM votes LIMIT 10;
```

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production setup.

**Recommended:** Railway.app (5 minutes, free tier available)

---

## ❓ Stuck?

1. Check browser console (`F12` → Console tab)
2. Check backend terminal for errors
3. Check `README.md` troubleshooting section
4. Verify environment variables are set correctly

---

**Happy polling! 🎉**
