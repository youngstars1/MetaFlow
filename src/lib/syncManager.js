/**
 * SyncManager — Orchestrates all sync operations
 * 
 * Responsibilities:
 * - Persist state changes to Supabase via WriteQueue
 * - Subscribe to Supabase Realtime for multi-device sync
 * - Prevent write loops (remote updates don't re-sync)
 * - Debounce rapid state changes
 * - Track connection and sync status
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { writeQueue } from './writeQueue';
import { dataRepository, mappers } from './dataRepository';

const DEBOUNCE_MS = 1500;
const TABLES = ['goals', 'transactions', 'routines'];

class SyncManager {
    constructor() {
        this._userId = null;
        this._dispatch = null;
        this._debounceTimer = null;
        this._realtimeChannels = [];
        this._isRemoteUpdate = false; // Prevents write loops
        this._lastSyncedState = null;
        this._status = 'idle'; // idle | syncing | error | offline
        this._listeners = new Set();
    }

    // ── Initialization ──────────────────────────────

    /**
     * Initialize sync with user and dispatch function
     */
    init(userId, dispatch) {
        this._userId = userId;
        this._dispatch = dispatch;

        if (userId && isSupabaseConfigured()) {
            this._subscribeRealtime();
            this._flushQueue();
        }
    }

    /**
     * Tear down subscriptions and timers
     */
    destroy() {
        this._unsubscribeRealtime();
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._userId = null;
        this._dispatch = null;
    }

    // ── Persistence (State → Cloud) ──────────────────

    /**
     * Called when app state changes. Debounces and persists.
     * @param {object} state - Full app state
     */
    onStateChange(state) {
        // Skip if: no user, no config, or this was a remote update
        if (!this._userId || !isSupabaseConfigured()) return;
        if (this._isRemoteUpdate) {
            this._isRemoteUpdate = false;
            return;
        }

        // Debounce rapid changes
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            this._persistDiff(state);
        }, DEBOUNCE_MS);
    }

    /**
     * Detect changes and queue writes
     */
    async _persistDiff(state) {
        if (!this._userId) return;

        this._setStatus('syncing');
        const uid = this._userId;

        try {
            // Profile (always sync — small payload)
            writeQueue.enqueue('UPSERT', 'profiles',
                dataRepository.profileToPayload(state.profile, state.gamification, state.envelopes, uid),
                uid
            );

            // Goals
            for (const goal of state.goals) {
                writeQueue.enqueue('UPSERT', 'goals',
                    dataRepository.goalToPayload(goal, uid),
                    uid
                );
            }

            // Transactions
            for (const tx of state.transactions) {
                writeQueue.enqueue('UPSERT', 'transactions',
                    dataRepository.txToPayload(tx, uid),
                    uid
                );
            }

            // Routines
            for (const routine of state.routines) {
                writeQueue.enqueue('UPSERT', 'routines',
                    dataRepository.routineToPayload(routine, uid),
                    uid
                );
            }

            // Flush the queue
            await writeQueue.flush(supabase);
            this._lastSyncedState = state;
            this._setStatus('idle');
        } catch (err) {
            console.warn('[SyncManager] Persist error:', err.message);
            this._setStatus('error');
        }
    }

    /**
     * Immediately sync a specific entity (used for deletes)
     */
    syncDelete(table, id) {
        if (!this._userId || !isSupabaseConfigured()) return;
        writeQueue.enqueue('DELETE', table, { id }, this._userId);
        writeQueue.flush(supabase);
    }

    // ── Realtime (Cloud → State) ─────────────────────

    _subscribeRealtime() {
        this._unsubscribeRealtime();

        if (!this._userId || !isSupabaseConfigured()) return;

        const uid = this._userId;

        // Subscribe to each table for this user's changes
        for (const table of TABLES) {
            const channel = supabase
                .channel(`${table}_${uid}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table,
                        filter: `user_id=eq.${uid}`,
                    },
                    (payload) => this._handleRealtimeEvent(table, payload)
                )
                .subscribe();

            this._realtimeChannels.push(channel);
        }

        // Profile channel
        const profileChannel = supabase
            .channel(`profiles_${uid}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `user_id=eq.${uid}`,
                },
                (payload) => this._handleRealtimeEvent('profiles', payload)
            )
            .subscribe();

        this._realtimeChannels.push(profileChannel);

        console.log('[SyncManager] Realtime subscriptions active');
    }

    _unsubscribeRealtime() {
        for (const channel of this._realtimeChannels) {
            try { supabase.removeChannel(channel); } catch { /* ignore */ }
        }
        this._realtimeChannels = [];
    }

    /**
     * Handle incoming realtime event from another device
     */
    _handleRealtimeEvent(table, payload) {
        if (!this._dispatch) return;

        const { eventType, new: newRow, old: oldRow } = payload;

        // Set flag to prevent write loop
        this._isRemoteUpdate = true;

        switch (table) {
            case 'goals': {
                if (eventType === 'DELETE' || newRow?.is_deleted) {
                    this._dispatch({ type: 'SYNC_REMOVE', payload: { table: 'goals', id: oldRow?.id || newRow?.id } });
                } else {
                    const mapped = mappers.goalFromDb(newRow);
                    this._dispatch({ type: 'SYNC_UPSERT', payload: { table: 'goals', item: mapped } });
                }
                break;
            }
            case 'transactions': {
                if (eventType === 'DELETE' || newRow?.is_deleted) {
                    this._dispatch({ type: 'SYNC_REMOVE', payload: { table: 'transactions', id: oldRow?.id || newRow?.id } });
                } else {
                    const mapped = mappers.txFromDb(newRow);
                    this._dispatch({ type: 'SYNC_UPSERT', payload: { table: 'transactions', item: mapped } });
                }
                break;
            }
            case 'routines': {
                if (eventType === 'DELETE' || newRow?.is_deleted) {
                    this._dispatch({ type: 'SYNC_REMOVE', payload: { table: 'routines', id: oldRow?.id || newRow?.id } });
                } else {
                    const mapped = mappers.routineFromDb(newRow);
                    this._dispatch({ type: 'SYNC_UPSERT', payload: { table: 'routines', item: mapped } });
                }
                break;
            }
            case 'profiles': {
                if (newRow) {
                    const mapped = mappers.profileFromDb(newRow);
                    this._dispatch({ type: 'SYNC_PROFILE', payload: mapped });
                }
                break;
            }
        }
    }

    // ── Queue Management ─────────────────────────────

    async _flushQueue() {
        if (writeQueue.size > 0) {
            console.log(`[SyncManager] Flushing ${writeQueue.size} queued operations`);
            await writeQueue.flush(supabase);
        }
    }

    // ── Status Management ────────────────────────────

    _setStatus(status) {
        this._status = status;
        this._listeners.forEach(fn => fn(status));
    }

    get status() { return this._status; }

    onStatusChange(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    get queueSize() { return writeQueue.size; }
}

// Singleton
export const syncManager = new SyncManager();
