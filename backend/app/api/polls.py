"""Poll API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.schemas.poll_schema import PollCreate, PollResponse, PollListItem
from app.services.poll_service import PollService

router = APIRouter(prefix="/polls", tags=["polls"])


@router.post("/", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
def create_poll(poll_data: PollCreate, db: Session = Depends(get_db)):
    """
    Create a new poll.
    
    - **question**: Poll question (1-500 characters)
    - **options**: List of at least 2 options (1-500 characters each)
    
    Returns the created poll with generated IDs.
    """
    try:
        poll = PollService.create_poll(db, poll_data)
        return poll
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create poll: {str(e)}"
        )


@router.get("/", response_model=List[PollListItem])
def get_polls(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get list of all polls.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    
    Returns list of polls with metadata (option count, total votes).
    """
    try:
        polls = PollService.get_polls(db, skip, limit)
        return polls
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch polls: {str(e)}"
        )


@router.get("/{poll_id}", response_model=PollResponse)
def get_poll(poll_id: UUID, db: Session = Depends(get_db)):
    """
    Get a specific poll by ID.
    
    - **poll_id**: UUID of the poll
    
    Returns poll details with all options and current vote counts.
    """
    poll = PollService.get_poll(db, poll_id)
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    return poll


@router.delete("/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poll(poll_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a poll.
    
    - **poll_id**: UUID of the poll
    
    Deletes the poll and all associated options and votes (cascade).
    """
    success = PollService.delete_poll(db, poll_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
