'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPoll, CreatePollData, VotingSecurityOption } from '@/lib/api';
import styles from './PollForm.module.css';

const VOTING_SECURITY_OPTIONS: { value: VotingSecurityOption; label: string; description: string }[] = [
    { 
        value: 'device_fingerprint', 
        label: 'Device Fingerprint (Recommended)', 
        description: 'One vote per device - Survives cache clearing' 
    },
    { 
        value: 'ip_address', 
        label: 'One vote per IP address',
        description: 'No votes from same IP/Network'
    },
    { 
        value: 'browser_session', 
        label: 'One vote per browser session',
        description: 'Resets when browser cache is cleared'
    },
    { 
        value: 'none', 
        label: 'None (Multiple votes allowed)',
        description: 'Allow unlimited votes'
    }
];

export default function PollForm() {
    const router = useRouter();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [votingSecurity, setVotingSecurity] = useState<VotingSecurityOption>('ip_address');
    const [duration, setDuration] = useState<number>(0);
    const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours' | 'days'>('days');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!question.trim()) {
            setError('Please enter a question');
            return;
        }

        const validOptions = options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
            setError('Please provide at least 2 options');
            return;
        }

        // Check for duplicates
        const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size !== validOptions.length) {
            setError('Duplicate options are not allowed');
            return;
        }

        setLoading(true);

        try {
            // Convert duration to minutes for better precision
            let durationMinutes = 0;
            if (duration > 0) {
                if (timeUnit === 'minutes') {
                    durationMinutes = duration;
                } else if (timeUnit === 'hours') {
                    durationMinutes = duration * 60;
                } else {
                    durationMinutes = duration * 24 * 60;
                }
            }

            const pollData: CreatePollData = {
                question: question.trim(),
                options: validOptions.map(text => ({ text: text.trim() })),
                voting_security: votingSecurity,
                duration_minutes: durationMinutes,
            };

            const poll = await createPoll(pollData);
            router.push(`/poll/${poll.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create poll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.title}>Create a New Poll</h2>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Question - Full Width */}
            <div className={styles.group}>
                <label htmlFor="question" className={styles.label}>
                    Poll Question
                </label>
                <input
                    id="question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What's your question?"
                    className={styles.input}
                    maxLength={500}
                />
            </div>

            {/* Expiry - Full Width */}
            <div className={styles.group}>
                <label htmlFor="duration" className={styles.label}>
                    Poll Expiry
                </label>
                <div className={styles.durationRow}>
                    <input
                        id="duration"
                        type="number"
                        min="0"
                        value={duration}
                        onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className={styles.durationInput}
                    />
                    <select
                        value={timeUnit}
                        onChange={(e) => setTimeUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                        className={styles.timeUnitSelect}
                    >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                <p className={styles.helperText}>
                    {duration === 0 
                        ? 'Poll will never expire' 
                        : `Expires in ${duration} ${timeUnit}`}
                </p>
            </div>

            {/* Options */}
            <div className={styles.group}>
                <label className={styles.label}>
                    Options
                </label>
                {options.map((option, index) => (
                    <div key={index} className={styles.optionWrapper}>
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className={`${styles.input} ${styles.optionInput}`}
                            maxLength={500}
                        />
                        {options.length > 2 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className={styles.removeButton}
                                title="Remove option"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddOption}
                    className={styles.addButton}
                >
                    + Add Option
                </button>
            </div>

            <div className={styles.group}>
                <label className={styles.label}>Voting security</label>
                <div className={styles.securityGrid}>
                    {VOTING_SECURITY_OPTIONS.map((opt) => (
                        <div key={opt.value} className={styles.securityOption}>
                            <input
                                type="radio"
                                id={`security-${opt.value}`}
                                name="security"
                                value={opt.value}
                                checked={votingSecurity === opt.value}
                                onChange={(e) => {
                                    const v = e.target.value as VotingSecurityOption;
                                    setVotingSecurity(v);
                                }}
                                className={styles.radioInput}
                            />
                            <label htmlFor={`security-${opt.value}`} className={styles.radioLabel}>
                                <div className={styles.optionTitle}>{opt.label}</div>
                                <div className={styles.optionDesc}>{opt.description}</div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
            >
                {loading ? 'Creating Poll...' : 'Create Poll'}
            </button>
        </form>
    );
}
