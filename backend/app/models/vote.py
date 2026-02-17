"""Vote model definition."""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class Vote(Base):
    """Vote table model."""
    __tablename__ = "votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    option_id = Column(UUID(as_uuid=True), ForeignKey("options.id", ondelete="CASCADE"), nullable=False)
    voter_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    poll = relationship("Poll", back_populates="votes")
    option = relationship("Option", back_populates="votes")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('poll_id', 'voter_hash', name='unique_voter_per_poll'),
        Index('idx_votes_poll_id', 'poll_id'),
    )
