/**
 * useSync() — Custom hook for the Sync Layer
 * 
 * Provides:
 * - syncStatus: 'idle' | 'syncing' | 'error' | 'offline' | 'loading'
 * - queueSize: number of pending writes
 * - isOnline: boolean (network state)
 * - lastSynced: Date | null
 * - forceSync: () => void
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncManager } from '../lib/syncManager';
import { writeQueue } from '../lib/writeQueue';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useSync() {
    const [syncStatus, setSyncStatus] = useState('idle');
    const [queueSize, setQueueSize] = useState(writeQueue.size);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [lastSynced, setLastSynced] = useState(null);

    // Track sync status
    useEffect(() => {
        const unsubStatus = syncManager.onStatusChange((status) => {
            setSyncStatus(status);
            if (status === 'idle') setLastSynced(new Date());
        });

        const unsubQueue = writeQueue.subscribe(({ size }) => {
            setQueueSize(size);
        });

        return () => {
            unsubStatus();
            unsubQueue();
        };
    }, []);

    // Track online/offline
    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => {
            setIsOnline(false);
            setSyncStatus('offline');
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    // Force sync
    const forceSync = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setSyncStatus('syncing');
        try {
            await writeQueue.flush(supabase);
            setSyncStatus('idle');
            setLastSynced(new Date());
        } catch {
            setSyncStatus('error');
        }
    }, []);

    return {
        syncStatus,
        queueSize,
        isOnline,
        lastSynced,
        forceSync,
        configured: isSupabaseConfigured(),
    };
}
