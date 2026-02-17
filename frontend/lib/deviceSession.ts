/**
 * IndexedDB Manager for persistent device session ID
 * Stores device ID across all browsers on same device
 * Survives: Cache clearing, browser restart, incognito (per session)
 */

const DB_NAME = 'poll_voter_db';
const DB_VERSION = 1;
const STORE_NAME = 'device_sessions';
const DEVICE_ID_KEY = 'device_session_id';

export class DeviceSessionManager {
    private db: IDBDatabase | null = null;

    async initialize(): Promise<void> {
        if (this.db) return;

        try {
            this.db = await this.openDatabase();
        } catch (error) {
            console.warn('IndexedDB not available, falling back to sessionStorage', error);
        }
    }

    private openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async getOrCreateDeviceSessionId(): Promise<string> {
        if (!this.db) await this.initialize();

        try {
            // Try to get existing device ID from IndexedDB
            let deviceId = await this.getDeviceSessionIdFromDB();

            if (!deviceId) {
                // Create new device ID if doesn't exist
                deviceId = this.generateDeviceSessionId();
                await this.saveDeviceSessionIdToDB(deviceId);
            }

            return deviceId;
        } catch (error) {
            console.warn('Using fallback device session method', error);
            return this.getOrCreateDeviceSessionIdFallback();
        }
    }

    private getDeviceSessionIdFromDB(): Promise<string | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            try {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(DEVICE_ID_KEY);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || null);
            } catch (error) {
                reject(error);
            }
        });
    }

    private saveDeviceSessionIdToDB(deviceId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            try {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(deviceId, DEVICE_ID_KEY);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    private generateDeviceSessionId(): string {
        // Generate UUIDv4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    private getOrCreateDeviceSessionIdFallback(): string {
        // Fallback: Use sessionStorage or localStorage
        const storageKey = 'device_session_id';

        let deviceId = sessionStorage.getItem(storageKey);

        if (!deviceId) {
            deviceId = this.generateDeviceSessionId();
            try {
                localStorage.setItem(storageKey, deviceId);
            } catch (e) {
                sessionStorage.setItem(storageKey, deviceId);
            }
        }

        return deviceId;
    }
}

// Export singleton instance
export const deviceSessionManager = new DeviceSessionManager();
