import PollForm from '@/components/PollForm';
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Create a Poll | RealTime Polls',
    description: 'Create a new poll with custom options and share it with others. Get real-time results as votes come in.',
};

export default function CreatePage() {
    return (
        <div className={styles.wrap}>
            <Link href="/" className={styles.backLink}>Back to Home</Link>
            <PollForm />
        </div>
    );
}
