"""Pydantic schemas for Vote API."""
from pydantic import BaseModel
from uuid import UUID


class VoteCreate(BaseModel):
    """Schema for creating a vote."""
    option_id: UUID
    session_id: str | None = None  # For voting_security=browser_session
    device_session_id: str | None = None  # Cross-browser device protection


class VoteResponse(BaseModel):
    """Schema for vote response."""
    success: bool
    message: str
    poll_id: UUID
    option_id: UUID
