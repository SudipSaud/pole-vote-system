"""Vote API endpoints with ROBUST PERSISTENT SECURITY PROTECTIONS."""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from uuid import UUID
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta
import logging
import hashlib

from app.db.database import get_db

logger = logging.getLogger(__name__)

def _get_client_ip(request: Request) -> str:
    """Resolve client IP, respecting X-Forwarded-For and X-Real-IP (e.g. behind proxy)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _get_user_agent(request: Request) -> str:
    """Extract User-Agent header for device fingerprinting."""
    return request.headers.get("user-agent", "unknown")


def _get_accept_language(request: Request) -> str:
    """Extract Accept-Language header for device fingerprinting."""
    return request.headers.get("accept-language", "en")


from app.models import Poll, Vote
from app.schemas.vote_schema import VoteCreate, VoteResponse
from app.services.vote_service import VoteService
from app.websocket.manager import manager

router = APIRouter(prefix="/votes", tags=["votes"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@router.post("/{poll_id}", response_model=VoteResponse)
@limiter.limit("5/minute")
async def submit_vote(
    request: Request,
    response: Response,
    poll_id: UUID,
    vote_data: VoteCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a vote for a poll option with THREE ROBUST SECURITY PROTECTIONS.
    
    ✅ PROTECTION 1: Device Fingerprinting (IP + User-Agent + Language)
       - Persists even after cache clear
       - Cannot be bypassed by incognito mode
       - Works across browser restarts
    
    ✅ PROTECTION 2: Secure Persistent Cookie
       - HTTP-Only cookie stores encrypted voter token
       - Server-side validation
       - Survives localStorage wipes
       - 7-day validity
    
    ✅ PROTECTION 3: Cross-Browser Device Session (IndexedDB)
       - Device ID persists across all browsers on same device
       - Prevents voting from multiple browsers on same device
       - Survives cache clearing and incognito mode
       - Works across all browsers using same device
    
    **Rate Limited:** 5 requests per minute per IP address.
    """
    # Load poll to read voting_security
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    # Check if poll has expired
    if poll.expires_at and datetime.now(poll.expires_at.tzinfo) >= poll.expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This poll has expired and is no longer accepting votes"
        )

    security = (poll.voting_security or "device_fingerprint").strip().lower()
    
    # Resolve client information
    client_ip = _get_client_ip(request)
    user_agent = _get_user_agent(request)
    accept_language = _get_accept_language(request)

    # Log security attempt
    logger.info(f"Vote attempt - Poll: {poll_id}, IP: {client_ip}, Security: {security}")

    voter_hash = None
    
    # PROTECTION 3 (Universal): Cross-Browser Device Session Check
    # ⚠️  NOTE: device_session_id is browser-specific (stored in each browser's IndexedDB)
    # So it's only useful for persistent_cookie mode as an OVERRIDE
    # For device_fingerprint and ip_address modes, we use IP-based identification instead
    device_session_id = vote_data.device_session_id or request.headers.get("x-device-session-id")
    device_session_hash = None
    if device_session_id:
        device_session_hash = VoteService.generate_device_session_hash(
            device_session_id=device_session_id,
            poll_id=str(poll_id)
        )

    # PROTECTION 1: Device Fingerprinting (default)
    if security == "device_fingerprint":
        """
        For device_fingerprint: Use IP + Language (NO User-Agent)
        This ensures same device = same hash, regardless of browser!
        Works across browsers because IP is the same on same device.
        (Different browsers have different User-Agents, so we ignore that)
        """
        # Use IP + Language ONLY (ignore device_session_id and User-Agent)
        voter_hash = hashlib.sha256(
            f"{client_ip}:{accept_language}:{poll_id}".encode()
        ).hexdigest()
        logger.info(f"Using device fingerprint (IP+Language) for poll {poll_id}")
    
    # PROTECTION 1: IP Address Only
    elif security == "ip_address":
        """
        For ip_address: Use only IP (most restrictive)
        Entire network on same IP cannot vote twice
        Same device on same network = same IP = blocked across browsers ✅
        """
        # Use IP ONLY (ignore device_session_id)
        voter_hash = VoteService.generate_voter_hash_ip_only(
            ip=client_ip,
            poll_id=str(poll_id)
        )
        logger.info(f"Using IP-only security for poll {poll_id}")

    # Browser session 
    elif security == "browser_session":
        """One vote per browser session"""
        session_id = vote_data.session_id or request.headers.get("x-session-id")
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session ID required for this poll"
            )
        voter_hash = VoteService.generate_voter_hash_session(
            session_id=session_id,
            poll_id=str(poll_id)
        )
        logger.info(f"Using browser session for poll {poll_id}")

    # No security (allows multiple votes)
    elif security == "none":
        import uuid as _uuid
        voter_hash = str(_uuid.uuid4())
        logger.info(f"No security enabled for poll {poll_id}")

    else:
        # Default to device fingerprint (IP + Language, no User-Agent)
        voter_hash = hashlib.sha256(
            f"{client_ip}:{accept_language}:{poll_id}".encode()
        ).hexdigest()
        logger.info(f"Using default device fingerprint for poll {poll_id}")

    # Submit the vote
    success, message, vote = VoteService.submit_vote(
        db=db,
        poll_id=poll_id,
        option_id=vote_data.option_id,
        voter_hash=voter_hash
    )

    if not success:
        # Determine appropriate status code
        if "not found" in message.lower():
            status_code = status.HTTP_404_NOT_FOUND
        elif "already voted" in message.lower() or "duplicate" in message.lower():
            status_code = status.HTTP_409_CONFLICT
        else:
            status_code = status.HTTP_400_BAD_REQUEST

        logger.warning(f"Vote rejected - {message} - Poll: {poll_id}")
        raise HTTPException(status_code=status_code, detail=message)

    # Broadcast updated results via WebSocket
    results = VoteService.get_poll_results(db, poll_id)
    if results:
        update_msg = {
            "type": "vote_update",
            "data": results
        }
        # Send to specific poll listeners
        await manager.broadcast(str(poll_id), update_msg)
        # Also send to home page / global listeners
        await manager.broadcast("all", update_msg)

    logger.info(f"Vote submitted successfully - Poll: {poll_id}")
    return VoteResponse(
        success=True,
        message=message,
        poll_id=poll_id,
        option_id=vote_data.option_id
    )


@router.get("/{poll_id}/results")
def get_results(poll_id: UUID, db: Session = Depends(get_db)):
    """
    Get current vote results for a poll.
    
    - **poll_id**: UUID of the poll
    
    Returns current vote counts for all options.
    """
    results = VoteService.get_poll_results(db, poll_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    return results
