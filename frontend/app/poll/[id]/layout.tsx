import { Metadata } from 'next';
import { fetchPoll } from '@/lib/api';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const poll = await fetchPoll(params.id);

        return {
            title: `Vote: ${poll.question} | RealTime Polls`,
            description: `Participate in the poll: ${poll.question}. See live results as votes come in.`,
            openGraph: {
                title: poll.question,
                description: `Join the conversation and vote now! ${poll.options.length} options available.`,
                type: 'website',
            },
        };
    } catch {
        return {
            title: 'Poll Not Found | RealTime Polls',
            description: 'This poll could not be found.',
        };
    }
}

export { default } from './page';
