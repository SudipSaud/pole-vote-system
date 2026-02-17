/**
 * API client for backend communication
 */

import { deviceSessionManager } from './deviceSession';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Option {
    id: string;
    text: string;
    vote_count: number;
}

export interface Poll {
    id: string;
    question: string;
    voting_security?: string;
    created_at: string;
    expires_at?: string | null;
    options: Option[];
}

export interface PollListItem {
    id: string;
    question: string;
    voting_security?: string;
    created_at: string;
    expires_at?: string | null;
    option_count: number;
    total_votes: number;
}

export type VotingSecurityOption = 'none' | 'browser_session' | 'ip_address' | 'device_fingerprint';

export interface CreatePollData {
    question: string;
    options: { text: string }[];
    voting_security?: VotingSecurityOption;
    duration_minutes?: number;
}

export interface VoteResponse {
    success: boolean;
    message: string;
    poll_id: string;
    option_id: string;
}

/**
 * Fetch all polls
 */
export async function fetchPolls(): Promise<PollListItem[]> {
    const response = await fetch(`${API_URL}/polls/`);
    if (!response.ok) {
        throw new Error('Failed to fetch polls');
    }
    return response.json();
}

/**
 * Fetch a single poll by ID
 */
export async function fetchPoll(id: string): Promise<Poll> {
    const response = await fetch(`${API_URL}/polls/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch poll');
    }
    return response.json();
}

/**
 * Create a new poll
 */
export async function createPoll(data: CreatePollData): Promise<Poll> {
    const response = await fetch(`${API_URL}/polls/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        try {
            const error = await response.json();
            // Handle Pydantic validation errors (array of errors)
            if (Array.isArray(error.detail)) {
                const messages = error.detail.map((err: any) => err.msg || JSON.stringify(err)).join('; ');
                throw new Error(messages);
            }
            // Handle simple string errors
            throw new Error(error.detail || error.message || 'Failed to create poll');
        } catch (parseErr) {
            throw new Error('Failed to create poll');
        }
    }

    return response.json();
}

const SESSION_STORAGE_KEY = 'poll_voter_session_id';

export function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
        id = crypto.randomUUID?.() ?? `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
}

/**
 * Submit a vote
 */
export async function submitVote(
    pollId: string,
    optionId: string,
    options?: { sessionId?: string }
): Promise<VoteResponse> {
    const sessionId = options?.sessionId ?? (typeof window !== 'undefined' ? getOrCreateSessionId() : undefined);
    
    // Get persistent device session ID (works across browsers)
    let deviceSessionId = '';
    try {
        await deviceSessionManager.initialize();
        deviceSessionId = await deviceSessionManager.getOrCreateDeviceSessionId();
    } catch (error) {
        console.warn('Could not get device session ID', error);
    }
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) headers['X-Session-ID'] = sessionId;
    if (deviceSessionId) headers['X-Device-Session-ID'] = deviceSessionId;
    
    const response = await fetch(`${API_URL}/votes/${pollId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
            option_id: optionId, 
            session_id: sessionId ?? null,
            device_session_id: deviceSessionId ?? null  // Cross-browser device ID
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit vote');
    }

    return response.json();
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string) {
    const response = await fetch(`${API_URL}/votes/${pollId}/results`);
    if (!response.ok) {
        throw new Error('Failed to fetch results');
    }
    return response.json();
}
