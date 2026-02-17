"""Business logic for poll operations."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone

from app.models import Poll, Option
from app.schemas.poll_schema import PollCreate, PollResponse, PollListItem


class PollService:
    """Service layer for poll operations."""
    
    @staticmethod
    def create_poll(db: Session, poll_data: PollCreate) -> Poll:
        """
        Create a new poll with options.
        
        Args:
            db: Database session
            poll_data: Poll creation data
            
        Returns:
            Created poll
        """
        # Create poll
        security = (poll_data.voting_security or "ip_address").strip().lower()
        if security not in ("none", "browser_session", "ip_address"):
            security = "ip_address"
        
        # Calculate expiration time with precise minute-based calculation
        expires_at = None
        if poll_data.duration_minutes > 0:
            # Use timezone-aware UTC datetime
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=poll_data.duration_minutes)
        
        poll = Poll(question=poll_data.question, voting_security=security, expires_at=expires_at)
        db.add(poll)
        db.flush()  # Get poll ID
        
        # Create options
        for option_data in poll_data.options:
            option = Option(
                poll_id=poll.id,
                text=option_data.text,
                vote_count=0
            )
            db.add(option)
        
        db.commit()
        db.refresh(poll)
        
        return poll
    
    @staticmethod
    def get_poll(db: Session, poll_id: UUID) -> Optional[Poll]:
        """
        Get a poll by ID.
        
        Args:
            db: Database session
            poll_id: Poll ID
            
        Returns:
            Poll or None
        """
        return db.query(Poll).filter(Poll.id == poll_id).first()
    
    @staticmethod
    def get_polls(db: Session, skip: int = 0, limit: int = 100) -> List[PollListItem]:
        """
        Get list of polls with metadata.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of poll summaries
        """
        try:
            polls = db.query(
                Poll.id,
                Poll.question,
                Poll.voting_security,
                Poll.created_at,
                Poll.expires_at,
                func.count(Option.id).label('option_count'),
                func.sum(Option.vote_count).label('total_votes')
            ).join(Option).group_by(Poll.id, Poll.question, Poll.voting_security, Poll.created_at, Poll.expires_at).order_by(Poll.created_at.desc()).offset(skip).limit(limit).all()
        except Exception:
            # Fallback if expires_at column doesn't exist
            polls = db.query(
                Poll.id,
                Poll.question,
                Poll.voting_security,
                Poll.created_at,
                func.count(Option.id).label('option_count'),
                func.sum(Option.vote_count).label('total_votes')
            ).join(Option).group_by(Poll.id, Poll.question, Poll.voting_security, Poll.created_at).order_by(Poll.created_at.desc()).offset(skip).limit(limit).all()
        
        return [
            PollListItem(
                id=poll.id,
                question=poll.question,
                voting_security=getattr(poll, 'voting_security', None) or "ip_address",
                created_at=poll.created_at,
                expires_at=getattr(poll, 'expires_at', None),
                option_count=poll.option_count,
                total_votes=poll.total_votes or 0
            )
            for poll in polls
        ]
    
    @staticmethod
    def delete_poll(db: Session, poll_id: UUID) -> bool:
        """
        Delete a poll.
        
        Args:
            db: Database session
            poll_id: Poll ID
            
        Returns:
            True if deleted, False if not found
        """
        poll = db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return False
        
        db.delete(poll)
        db.commit()
        return True
