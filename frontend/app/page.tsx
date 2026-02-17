'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchPolls, PollListItem } from '@/lib/api';
import styles from './page.module.css';

export default function Home() {
    const [polls, setPolls] = useState<PollListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPolls = async () => {
            try {
                const data = await fetchPolls();
                setPolls(data);
            } catch (err) {
                setError('Failed to load polls');
            } finally {
                setLoading(false);
            }
        };
        loadPolls();
    }, []);

    const totalVotes = polls.reduce((sum, p) => sum + p.total_votes, 0);

    return (
        <div className={styles.wrap}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Create & vote on polls instantly</h1>
                <p className={styles.subtitle}>
                    Real-time results, fair voting, no sign-up required.
                </p>
                <Link href="/create" className={styles.ctaButton}>+ Create poll</Link>
            </div>

            {!loading && (
                <div className={styles.overviewGrid}>
                    <div className={`${styles.overviewCard} ${styles.overviewCardPrimary}`}>
                        <div className={styles.overviewLabel}>Total polls</div>
                        <div className={styles.overviewValue}>{polls.length}</div>
                    </div>
                    <div className={styles.overviewCard}>
                        <div className={styles.overviewLabel}>Total votes</div>
                        <div className={styles.overviewValue}>{totalVotes}</div>
                    </div>
                </div>
            )}

            <div>
                <h2 className={styles.sectionTitle}>Recent polls</h2>

                {loading && (
                    <div className={styles.loading}>
                        <p>Loading polls...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.errorBanner}>{error}</div>
                )}

                {!loading && !error && polls.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No polls yet. Be the first to create one.</p>
                        <Link href="/create" className={styles.ctaButton}>Create</Link>
                    </div>
                )}

                {!loading && polls.length > 0 && (
                    <div className={styles.pollGrid}>
                        {polls.map((poll) => {
                            const participation = polls.length > 0 
                                ? Math.round((poll.total_votes / Math.max(...polls.map(p => p.total_votes || 1))) * 100)
                                : 0;
                            
                            return (
                                <Link
                                    key={poll.id}
                                    href={`/poll/${poll.id}`}
                                    className={styles.pollCard}
                                >
                                    <div className={styles.pollHeader}>
                                        <h3 className={styles.pollQuestion}>
                                            {poll.question}
                                        </h3>
                                        <div className={styles.pollStats}>
                                            <div className={`${styles.pollStatCircle} ${participation > 50 ? styles.high : ''}`}>
                                                {poll.total_votes}
                                            </div>
                                            <div className={styles.pollStatLabel}>Votes</div>
                                        </div>
                                    </div>

                                    <div className={styles.pollContent}>
                                        <div className={styles.pollTags}>
                                            <span className={styles.pollTag}>
                                                📝 {poll.option_count} {poll.option_count === 1 ? 'option' : 'options'}
                                            </span>
                                            <span className={`${styles.pollTag} ${styles.orange}`}>
                                                🗳️ {participation}% active
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.pollMeta}>
                                        <span className={styles.pollCreatedDate}>
                                            {new Date(poll.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
