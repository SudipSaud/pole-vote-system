"""Pydantic schemas for Poll API."""
from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime
from uuid import UUID


class OptionCreate(BaseModel):
    """Schema for creating a poll option."""
    text: str = Field(..., min_length=1, max_length=500)


class OptionResponse(BaseModel):
    """Schema for option in responses."""
    id: UUID
    text: str
    vote_count: int
    
    class Config:
        from_attributes = True


class PollCreate(BaseModel):
    """Schema for creating a poll."""
    question: str = Field(..., min_length=1, max_length=500)
    options: List[OptionCreate] = Field(..., min_length=2)
    voting_security: str = Field(
        default="device_fingerprint",
        description="Voting security level: none | browser_session | ip_address | device_fingerprint | persistent_cookie"
    )
    duration_minutes: int = Field(default=0, ge=0, description="Poll duration in minutes (0 = no expiration)")
    
    @field_validator('options')
    @classmethod
    def validate_options(cls, v):
        """Validate options list."""
        if len(v) < 2:
            raise ValueError('Poll must have at least 2 options')
        
        # Check for duplicate option texts
        texts = [opt.text for opt in v]
        if len(texts) != len(set(texts)):
            raise ValueError('Duplicate option texts are not allowed')
        
        return v


class PollResponse(BaseModel):
    """Schema for poll in responses."""
    id: UUID
    question: str
    voting_security: str = "ip_address"
    created_at: datetime
    expires_at: datetime | None = None
    options: List[OptionResponse]
    
    class Config:
        from_attributes = True


class PollListItem(BaseModel):
    """Schema for poll in list responses."""
    id: UUID
    question: str
    voting_security: str = "ip_address"
    created_at: datetime
    expires_at: datetime | None = None
    option_count: int
    total_votes: int
