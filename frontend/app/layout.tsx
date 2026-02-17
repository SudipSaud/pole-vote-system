import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import styles from './Layout.module.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'RealTime Polls - Create & Vote on Polls Instantly',
    description: 'A modern, real-time polling platform with live results and fair voting mechanisms. Create polls, share them, and see results update instantly.',
    keywords: ['polls', 'voting', 'real-time', 'survey', 'feedback'],
    authors: [{ name: 'Poll System' }],
    openGraph: {
        title: 'RealTime Polls',
        description: 'Create and vote on polls with real-time results',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className} contentEditable={false} suppressContentEditableWarning>
                <nav className={styles.nav}>
                    <div className={styles.navContent}>
                        <a href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🗳️</span>
                            RealTime Polls
                        </a>
                        <div className={styles.menu}>
                            <a href="/" className={styles.link}>Home</a>
                            <a href="/create" className={styles.ctaNav}>Create</a>
                        </div>
                    </div>
                </nav>

                <main className={styles.main}>
                    {children}
                </main>

                <footer className={styles.footer}>
                    <div className={styles.footerText}>
                        <p>
                            Built with Next.js, FastAPI, and PostgreSQL • Real-time updates via WebSockets
                        </p>
                        <p style={{ marginTop: '0.5rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                            Developed by Sudip Saud
                        </p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
