'use client';

import { useState } from 'react';
import { Option } from '@/lib/api';
import styles from './VoteOptions.module.css';

interface VoteOptionsProps {
    options: Option[];
    onVote: (optionId: string) => Promise<void>;
    disabled?: boolean;
}

export default function VoteOptions({ options, onVote, disabled }: VoteOptionsProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [voting, setVoting] = useState(false);

    const handleVote = async (optionId: string) => {
        if (disabled || voting) return;

        setSelectedOption(optionId);
        setVoting(true);

        try {
            await onVote(optionId);
        } catch (error) {
            setSelectedOption(null);
        } finally {
            setVoting(false);
        }
    };

    return (
        <div className={styles.container}>
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={disabled || voting}
                    className={`${styles.optionButton} ${selectedOption === option.id ? styles.selected : ''
                        }`}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{option.text}</span>
                        {selectedOption === option.id && voting && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>Voting...</span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}
