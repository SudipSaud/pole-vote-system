"""WebSocket connection manager for real-time updates."""
from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time poll updates."""
    
    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, poll_id: str):
        """
        Accept and register a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            poll_id: Poll ID to subscribe to
        """
        await websocket.accept()
        
        if poll_id not in self.active_connections:
            self.active_connections[poll_id] = []
        
        self.active_connections[poll_id].append(websocket)
        logger.info(f"Client connected to poll {poll_id}. Total connections: {len(self.active_connections[poll_id])}")
    
    def disconnect(self, websocket: WebSocket, poll_id: str):
        """
        Remove a WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            poll_id: Poll ID to unsubscribe from
        """
        if poll_id in self.active_connections:
            if websocket in self.active_connections[poll_id]:
                self.active_connections[poll_id].remove(websocket)
                logger.info(f"Client disconnected from poll {poll_id}. Remaining: {len(self.active_connections[poll_id])}")
            
            # Clean up empty poll rooms
            if not self.active_connections[poll_id]:
                del self.active_connections[poll_id]
    
    async def broadcast(self, poll_id: str, data: dict):
        """
        Broadcast data to all connections in a poll room.
        
        Args:
            poll_id: Poll ID to broadcast to
            data: Data to send
        """
        if poll_id not in self.active_connections:
            return
        
        # Create list copy to avoid modification during iteration
        connections = self.active_connections[poll_id].copy()
        
        for connection in connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                # Remove failed connection
                self.disconnect(connection, poll_id)
    
    def get_connection_count(self, poll_id: str) -> int:
        """
        Get number of active connections for a poll.
        
        Args:
            poll_id: Poll ID
            
        Returns:
            Number of active connections
        """
        return len(self.active_connections.get(poll_id, []))


# Global connection manager instance
manager = ConnectionManager()
