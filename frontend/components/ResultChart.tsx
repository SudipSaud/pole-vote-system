'use client';

import { useState } from 'react';
import { Option } from '@/lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ResultChart.module.css';

interface ResultChartProps {
    options: Option[];
    totalVotes: number;
}

const BAR_COLORS = ['#22c55e', '#ea580c', '#a78bfa', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#84cc16'];

export default function ResultChart({ options, totalVotes }: ResultChartProps) {
    const [view, setView] = useState<'bars' | 'pie' | 'chart'>('bars');

    const getPercentage = (votes: number) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    const sortedOptions = [...options].sort((a, b) => b.vote_count - a.vote_count);
    const chartData = sortedOptions.map((opt, i) => ({
        name: opt.text.length > 24 ? opt.text.slice(0, 22) + '…' : opt.text,
        fullName: opt.text,
        value: opt.vote_count,
        percentage: getPercentage(opt.vote_count),
        fill: BAR_COLORS[i % BAR_COLORS.length],
    }));

    const maxVotes = Math.max(...sortedOptions.map(o => o.vote_count), 1);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Results</h3>
                <div className={styles.controls}>
                    <span className={styles.totalVotes}>
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </span>
                    <div className={styles.viewToggle}>
                        <button
                            type="button"
                            className={view === 'bars' ? styles.toggleActive : styles.toggleBtn}
                            onClick={() => setView('bars')}
                        >
                            Bars
                        </button>
                        <button
                            type="button"
                            className={view === 'pie' ? styles.toggleActive : styles.toggleBtn}
                            onClick={() => setView('pie')}
                        >
                            Pie
                        </button>
                        <button
                            type="button"
                            className={view === 'chart' ? styles.toggleActive : styles.toggleBtn}
                            onClick={() => setView('chart')}
                        >
                            Chart
                        </button>
                    </div>
                </div>
            </div>

            {totalVotes === 0 ? (
                <div className={styles.empty}>No votes yet. Be the first to vote!</div>
            ) : (
                <>
                    {view === 'bars' && (
                        <div className={styles.strawBars}>
                            {sortedOptions.map((option, index) => {
                                const pct = getPercentage(option.vote_count);
                                return (
                                    <div key={option.id} className={styles.barRow}>
                                        <span className={styles.barLabel}>{option.text}</span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.barFill}
                                                style={{
                                                    width: `${(option.vote_count / maxVotes) * 100}%`,
                                                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                                                }}
                                            />
                                        </div>
                                        <span className={styles.barStats}>
                                            {pct}% ({option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {view === 'pie' && (
                        <div className={styles.pieWrap}>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="fullName"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={96}
                                        label={({ name, percentage }) => `${name} ${percentage}%`}
                                        animationDuration={500}
                                    >
                                        {chartData.map((entry, i) => (
                                            <Cell key={`cell-${i}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                                        labelStyle={{ color: '#9ca3af' }}
                                        formatter={(value: number, _n: string, props: { payload: { percentage: number } }) =>
                                            [`${value} votes (${props.payload.percentage}%)`]
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {view === 'chart' && (
                        <div className={styles.barChartWrap}>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                                    <XAxis type="number" allowDecimals={false} stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                                        formatter={(value: number, _n: string, props: { payload: { percentage: number } }) =>
                                            [`${value} votes (${props.payload.percentage}%)`]
                                        }
                                    />
                                    <Bar dataKey="value" name="Votes" radius={[0, 4, 4, 0]} animationDuration={500}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={`cell-${i}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
