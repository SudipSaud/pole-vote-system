"""Business logic for vote operations."""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from uuid import UUID
import hashlib
import uuid as uuid_lib
import hmac
import json
from datetime import datetime, timedelta

from app.models import Vote, Option, Poll


class VoteService:
    """Service layer for vote operations."""
    
    # In-memory storage for voter tokens (in production, use Redis)
    _voter_tokens: dict = {}  # {token: {poll_id, ip, created_at, hash}}
    
    @staticmethod
    def generate_voter_hash_ip_only(ip: str, poll_id: str) -> str:
        """One vote per IP address: hash only IP + poll_id."""
        data = f"{ip}:{poll_id}"
        return hashlib.sha256(data.encode()).hexdigest()

    @staticmethod
    def generate_voter_hash_session(session_id: str, poll_id: str) -> str:
        """One vote per browser session: hash session_id + poll_id."""
        data = f"{session_id}:{poll_id}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def generate_device_session_hash(device_session_id: str, poll_id: str) -> str:
        """
        PROTECTION 3: Device session hash (works across browsers on same device).
        
        Device session ID is generated once per device (stored in IndexedDB)
        and sent with every vote from any browser on that device.
        This prevents voting from multiple browsers on the same device.
        
        Example:
        - Device session: uuid-abc-123
        - Poll: def-456
        - Hash: SHA256(uuid-abc-123:def-456)
        
        Same device, different browser → Same device_session_id → Same hash → REJECTED
        """
        data = f"{device_session_id}:{poll_id}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def generate_device_fingerprint(ip: str, user_agent: str, accept_language: str, poll_id: str) -> str:
        """
        PROTECTION 1: Generate device fingerprint from multiple factors.
        Combines: IP + User-Agent + Language + Poll ID
        Survives: Cache clearing, incognito mode, localStorage wipes
        
        Example:
        - IP: 192.168.1.1
        - User-Agent: Mozilla/5.0...
        - Language: en-US
        - Poll: abc-123
        Result: SHA256(all combined) → unique voter ID
        """
        # Normalize user agent (remove version numbers for stability)
        ua_parts = user_agent.split('/')[:2]  # Keep browser name only
        normalized_ua = '/'.join(ua_parts)
        
        # Combine all factors
        data = f"{ip}:{normalized_ua}:{accept_language}:{poll_id}"
        fingerprint = hashlib.sha256(data.encode()).hexdigest()
        
        return fingerprint
    
    @staticmethod
    def generate_persistent_voter_token(poll_id: str, ip: str) -> str:
        """
        PROTECTION 2: Generate secure persistent voter token.
        Token stored in HTTP-Only cookie, validated server-side.
        Survives: Cache clearing, private browsing (cookie persists)
        
        Token format: {poll_id}:{uuid}:{timestamp}:{hmac_signature}
        """
        token_id = str(uuid_lib.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Create token
        token_data = f"{poll_id}:{token_id}:{timestamp}:{ip}"
        
        # Sign token with HMAC (prevents tampering)
        signature = hmac.new(
            b"secret_key_change_in_production",
            token_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        voter_token = f"{token_data}:{signature}"
        
        # Store token with metadata (in-memory, use Redis in production)
        VoteService._voter_tokens[voter_token] = {
            "poll_id": str(poll_id),
            "created_at": datetime.utcnow(),
            "ip": ip
        }
        
        return voter_token
    
    @staticmethod
    def validate_persistent_voter_token(voter_token: str, poll_id: str) -> bool:
        """
        Validate persistent voter token.
        Checks: Token exists, not expired, matches poll_id
        """
        if voter_token not in VoteService._voter_tokens:
            return False
        
        token_data = VoteService._voter_tokens[voter_token]
        
        # Check poll_id matches
        if token_data["poll_id"] != str(poll_id):
            return False
        
        # Check not expired (24 hour validity)
        created_at = token_data["created_at"]
        if datetime.utcnow() - created_at > timedelta(hours=24):
            del VoteService._voter_tokens[voter_token]  # Clean up
            return False
        
        return True
    
    @staticmethod
    def submit_vote(
        db: Session,
        poll_id: UUID,
        option_id: UUID,
        voter_hash: str,
    ) -> tuple[bool, str, Optional[Vote]]:
        """
        Submit a vote for a poll option.
        
        Two-layer protection:
        1. Database UNIQUE constraint on (poll_id, voter_hash)
        2. In-memory check for recent duplicates
        
        Args:
            db: Database session
            poll_id: Poll ID
            option_id: Option ID to vote for
            voter_hash: Unique voter identifier (device fingerprint or persistent token)
            
        Returns:
            Tuple of (success, message, vote)
        """
        # Verify poll exists
        poll = db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return False, "Poll not found", None
        
        # Verify option exists and belongs to poll
        option = db.query(Option).filter(
            Option.id == option_id,
            Option.poll_id == poll_id
        ).first()
        
        if not option:
            return False, "Option not found or does not belong to this poll", None
        
        # Check for recent duplicate vote (in-memory cache)
        cache_key = f"{poll_id}:{voter_hash}"
        if cache_key in VoteService._voter_tokens:
            return False, "You have already voted in this poll (detected by security system)", None
        
        # Create vote
        vote = Vote(
            poll_id=poll_id,
            option_id=option_id,
            voter_hash=voter_hash
        )
        
        try:
            db.add(vote)
            option.vote_count += 1
            
            # Mark this voter as having voted (for duplicate detection)
            VoteService._voter_tokens[cache_key] = {
                "voted_at": datetime.utcnow()
            }
            
            db.commit()
            db.refresh(vote)
            return True, "Vote submitted successfully", vote
        except IntegrityError:
            db.rollback()
            return False, "You have already voted in this poll (duplicate detected)", None
    
    @staticmethod
    def get_poll_results(db: Session, poll_id: UUID) -> Optional[dict]:
        """
        Get current vote results for a poll.
        
        Args:
            db: Database session
            poll_id: Poll ID
            
        Returns:
            Dictionary with poll results or None
        """
        poll = db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return None
        
        options_data = [
            {
                "id": str(option.id),
                "text": option.text,
                "vote_count": option.vote_count
            }
            for option in poll.options
        ]
        
        total_votes = sum(opt["vote_count"] for opt in options_data)
        
        return {
            "poll_id": str(poll_id),
            "question": poll.question,
            "total_votes": total_votes,
            "options": options_data
        }
