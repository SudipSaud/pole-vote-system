/**
 * WebSocket client for real-time poll updates
 */

// Derive WebSocket URL from API URL if not explicitly provided
const getWsUrl = () => {
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) return wsUrl.replace(/\/$/, ''); // Strip trailing slash

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // 1. Strip trailing slash from API URL
    const cleanApiUrl = apiUrl.replace(/\/$/, '');

    // 2. Map protocols: http -> ws, https -> wss
    if (cleanApiUrl.startsWith('https://')) {
        return cleanApiUrl.replace('https://', 'wss://');
    } else if (cleanApiUrl.startsWith('http://')) {
        return cleanApiUrl.replace('http://', 'ws://');
    }

    return cleanApiUrl; // Fallback
};

const WS_URL = getWsUrl();

export interface PollUpdateData {
    poll_id: string;
    question: string;
    total_votes: number;
    options: {
        id: string;
        text: string;
        vote_count: number;
    }[];
}

export interface WebSocketMessage {
    type: string;
    data?: PollUpdateData;
    message?: string;
}

export class PollWebSocket {
    private ws: WebSocket | null = null;
    private pollId: string;
    private onUpdate: (data: PollUpdateData) => void;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor(pollId: string, onUpdate: (data: PollUpdateData) => void) {
        this.pollId = pollId;
        this.onUpdate = onUpdate;
    }

    connect() {
        try {
            this.ws = new WebSocket(`${WS_URL}/ws/polls/${this.pollId}`);

            this.ws.onopen = () => {
                console.log(`Connected to poll ${this.pollId}`);
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    if (message.type === 'vote_update' && message.data) {
                        this.onUpdate(message.data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
