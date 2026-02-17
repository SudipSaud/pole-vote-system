"""Main FastAPI application."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging

from app.db.database import Base, engine, settings
from app.api import polls, votes
from app.websocket.manager import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Real-Time Poll & Voting System",
    description="Production-grade polling platform with real-time updates and fairness mechanisms",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
# Using "*" with allow_credentials=False is the most compatible way to handle CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limit error handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(polls.router)
app.include_router(votes.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Real-Time Poll & Voting System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.websocket("/ws/polls/{poll_id}")
async def websocket_endpoint(websocket: WebSocket, poll_id: str):
    """
    WebSocket endpoint for real-time poll updates.
    
    - **poll_id**: UUID of the poll, or 'all' to subscribe to all poll updates.
    """
    await manager.connect(websocket, poll_id)
    try:
        while True:
            # Keep connection alive and receive any client messages
            await websocket.receive_text()
            # Echo back for connection verification
            await websocket.send_json({"type": "ping", "message": "connected", "room": poll_id})
    except WebSocketDisconnect:
        manager.disconnect(websocket, poll_id)
        logger.info(f"Client disconnected from room {poll_id}")
    except Exception as e:
        logger.error(f"WebSocket error in room {poll_id}: {e}")
        manager.disconnect(websocket, poll_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
