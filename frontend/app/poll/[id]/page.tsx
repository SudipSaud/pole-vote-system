'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPoll, submitVote, Poll } from '@/lib/api';
import { PollWebSocket } from '@/lib/websocket';
import VoteOptions from '@/components/VoteOptions';
import ResultChart from '@/components/ResultChart';
import Link from 'next/link';
import styles from './page.module.css';

interface PollUpdateData {
    poll_id: string;
    question: string;
    total_votes: number;
    options: {
        id: string;
        text: string;
        vote_count: number;
    }[];
}

export default function PollPage() {
    const params = useParams();
    const pollId = params.id as string;

    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [voteError, setVoteError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [countdown, setCountdown] = useState<string>('');

    // Load poll data and setup WebSocket
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let ws: PollWebSocket | undefined;

        const loadAndSetup = async () => {
            try {
                // Load initial data
                const data = await fetchPoll(pollId);
                setPoll(data);
                setLoading(false);

                // Setup WebSocket
                ws = new PollWebSocket(pollId, (data: PollUpdateData) => {
                    setPoll(prevPoll => {
                        if (!prevPoll) return null;

                        // Create a map for quick lookup
                        const updateMap = new Map(data.options.map((opt: any) => [opt.id, opt])); // eslint-disable-line @typescript-eslint/no-explicit-any

                        // Merge updates while preserving order
                        const updatedOptions = prevPoll.options.map(opt => {
                            const update = updateMap.get(opt.id);
                            if (update) {
                                return {
                                    ...opt,
                                    vote_count: update.vote_count
                                };
                            }
                            return opt;
                        });

                        return {
                            ...prevPoll,
                            options: updatedOptions,
                        };
                    });
                });

                ws.connect();
                setIsConnected(true);

                cleanup = () => {
                    ws?.disconnect();
                };
            } catch (err) {
                setError('Failed to load poll');
                setLoading(false);
            }
        };

        if (pollId) {
            loadAndSetup();
        }

        return () => {
            if (cleanup) cleanup();
            if (ws) ws.disconnect();
        };
    }, [pollId]);

    // Update countdown timer
    useEffect(() => {
        if (!poll || !poll.expires_at) return;

        const updateCountdown = () => {
            const expiresAt = new Date(poll.expires_at!).getTime();
            const now = new Date().getTime();
            const diff = expiresAt - now;

            if (diff <= 0) {
                setCountdown('Expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setCountdown(`${days}d ${hours}h ${minutes}m left`);
            } else if (hours > 0) {
                setCountdown(`${hours}h ${minutes}m ${seconds}s left`);
            } else if (minutes > 0) {
                setCountdown(`${minutes}m ${seconds}s left`);
            } else {
                setCountdown(`${seconds}s left`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [poll?.expires_at, poll]);

    const handleVote = async (optionId: string) => {
        setVoteError('');
        try {
            await submitVote(pollId, optionId);
            setHasVoted(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
            setVoteError(errorMessage);

            // If already voted, show results
            if (errorMessage.includes('already voted')) {
                setHasVoted(true);
            }

            // Re-throw to let VoteOptions component handle state
            throw err;
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Poll link copied to clipboard!');
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading poll...</p>
            </div>
        );
    }

    if (error || !poll) {
        return (
            <div className={styles.wrap}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>😕</div>
                    <h2>Poll Not Found</h2>
                    <p>{error || 'This poll does not exist'}</p>
                    <Link href="/" className={styles.backLink}>Back to Home</Link>
                </div>
            </div>
        );
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
    
    // Check if poll is expired
    const isPollExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

    return (
        <div className={styles.wrap}>
            <Link href="/" className={styles.backLink}>← Back</Link>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.questionRow}>
                        <h1 className={styles.question}>{poll.question}</h1>
                        {isConnected && (
                            <span className={styles.liveIndicator}>
                                <span className={styles.pulse} />
                                Live
                            </span>
                        )}
                    </div>
                    <div className={styles.meta}>
                        <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{poll.options.length} options</span>
                        {isPollExpired && (
                            <>
                                <span>·</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>Expired</span>
                            </>
                        )}
                        {!isPollExpired && countdown && (
                            <>
                                <span>·</span>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>{countdown}</span>
                            </>
                        )}
                    </div>
                </div>

                {voteError && !voteError.includes('already voted') && !voteError.includes('expired') && <div className={styles.voteError}>{voteError}</div>}

                <div className={styles.sectionTitle}>
                    {isPollExpired ? 'Poll closed' : hasVoted ? 'Your vote' : 'Cast your vote'}
                </div>
                {isPollExpired ? (
                    <div className={styles.pollClosed}>This poll has expired and is no longer accepting votes</div>
                ) : !hasVoted ? (
                    <VoteOptions options={poll.options} onVote={handleVote} />
                ) : voteError && voteError.includes('already voted') ? (
                    <div className={styles.alreadyVoted}>Already voted</div>
                ) : (
                    <div className={styles.thankYou}>✓ Thank you for voting!</div>
                )}

                <div className={styles.resultsSection}>
                    <ResultChart options={poll.options} totalVotes={totalVotes} />
                </div>

                <div className={styles.actionsRow}>
                    {isConnected && (
                        <span className={styles.liveButton}>
                            <span className={styles.liveDot} />
                            Live results
                        </span>
                    )}
                    <button type="button" onClick={handleShare} className={styles.shareButton}>
                        📋 Copy link
                    </button>
                    <Link href="/" className={styles.shareButton}>
                        ← Back to polls
                    </Link>
                </div>
            </div>
        </div>
    );
}
