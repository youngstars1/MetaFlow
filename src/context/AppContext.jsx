import { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { storage } from '../utils/storage';
import { generateId } from '../utils/helpers';
import { XP_REWARDS, calculateLevel, evaluateBadges } from '../utils/gamification';
import { Finance, Sanitize } from '../utils/security';
import { getEnvelopes, saveEnvelopes } from '../utils/envelopes';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { hydrationService } from '../lib/hydrationService';
import { syncManager } from '../lib/syncManager';

const AppContext = createContext();

const initialState = {
    goals: [],
    transactions: [],
    routines: [],
    envelopes: { enabled: false, rules: [] },
    profile: { name: '', email: '', incomeSources: [], currency: 'CLP' },
    gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
    isLoaded: false,
    _undoStack: [],
};

// =================== STREAK ===================
function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i <= 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        if (sorted.includes(d.toDateString())) { streak++; }
        else if (i > 0) { break; }
    }
    return streak;
}

function addXP(gamification, amount, action) {
    if (amount <= 0) return gamification;
    return {
        ...gamification,
        totalXP: (gamification.totalXP || 0) + amount,
        xpLog: [{ action, xp: amount, timestamp: Date.now() }, ...(gamification.xpLog || [])].slice(0, 100),
    };
}

// =================== REDUCER ===================
function appReducer(state, action) {
    switch (action.type) {
        case 'LOAD_DATA': return { ...state, ...action.payload, isLoaded: true };
        case 'ADD_XP': return { ...state, gamification: addXP(state.gamification, action.payload, 'MANUAL') };

        // ── GOALS ────────────────────────────
        case 'ADD_GOAL': {
            const sanitized = {
                ...action.payload,
                id: action.payload.id || generateId(),
                name: Sanitize.html(action.payload.name),
                description: Sanitize.html(action.payload.description),
                targetAmount: Finance.parse(action.payload.targetAmount),
                currentAmount: Finance.parse(action.payload.currentAmount || 0),
            };
            const xpGain = state.goals.length === 0 ? XP_REWARDS.FIRST_GOAL + XP_REWARDS.GOAL_CREATED : XP_REWARDS.GOAL_CREATED;
            return { ...state, goals: [...state.goals, sanitized], gamification: addXP(state.gamification, xpGain, 'GOAL_CREATED') };
        }
        case 'UPDATE_GOAL':
            return {
                ...state,
                goals: state.goals.map(g => g.id === action.payload.id ? {
                    ...g, ...action.payload,
                    name: action.payload.name ? Sanitize.html(action.payload.name) : g.name,
                    targetAmount: action.payload.targetAmount !== undefined ? Finance.parse(action.payload.targetAmount) : g.targetAmount,
                } : g),
            };
        case 'DELETE_GOAL': {
            const goalToDelete = state.goals.find(g => g.id === action.payload);
            syncManager.syncDelete('goals', action.payload);
            return {
                ...state,
                goals: state.goals.filter(g => g.id !== action.payload),
                _undoStack: [...state._undoStack, { type: 'RESTORE_GOAL', data: goalToDelete, timestamp: Date.now() }].slice(-10),
            };
        }
        case 'RESTORE_GOAL': return { ...state, goals: [...state.goals, action.payload] };
        case 'ADD_SAVINGS_TO_GOAL': {
            const { goalId, amount } = action.payload;
            const parsedAmount = Finance.parse(amount);
            let extraXP = 0;
            const goal = state.goals.find(g => g.id === goalId);
            if (!goal) return state;
            const oldAmount = Finance.parse(goal.currentAmount || 0);
            const newAmount = Finance.add(oldAmount, parsedAmount);
            if (oldAmount < goal.targetAmount && newAmount >= goal.targetAmount) extraXP += XP_REWARDS.GOAL_COMPLETED;
            return {
                ...state,
                goals: state.goals.map(g => g.id === goalId ? { ...g, currentAmount: newAmount } : g),
                gamification: addXP(state.gamification, XP_REWARDS.SAVINGS_REGISTERED + extraXP, 'SAVINGS_REGISTERED'),
            };
        }

        // ── TRANSACTIONS ─────────────────────
        case 'ADD_TRANSACTION': {
            const sanitized = { ...action.payload, id: generateId(), note: Sanitize.html(action.payload.note), amount: Finance.parse(action.payload.amount) };
            const xpGain = state.transactions.length === 0 ? XP_REWARDS.FIRST_TRANSACTION + XP_REWARDS.TRANSACTION_LOGGED : XP_REWARDS.TRANSACTION_LOGGED;
            return { ...state, transactions: [sanitized, ...state.transactions], gamification: addXP(state.gamification, xpGain, 'TRANSACTION_LOGGED') };
        }
        case 'DELETE_TRANSACTION': {
            const txToDelete = state.transactions.find(t => t.id === action.payload);
            syncManager.syncDelete('transactions', action.payload);
            return {
                ...state,
                transactions: state.transactions.filter(t => t.id !== action.payload),
                _undoStack: [...state._undoStack, { type: 'RESTORE_TRANSACTION', data: txToDelete, timestamp: Date.now() }].slice(-10),
            };
        }
        case 'RESTORE_TRANSACTION': return { ...state, transactions: [action.payload, ...state.transactions] };

        // ── ROUTINES ─────────────────────────
        case 'ADD_ROUTINE': {
            const newRoutine = { ...action.payload, id: action.payload.id || generateId(), name: Sanitize.html(action.payload.name), objective: action.payload.objective ? Sanitize.html(action.payload.objective) : '', streak: 0, completedDates: [], createdAt: new Date().toISOString() };
            return { ...state, routines: [...state.routines, newRoutine], gamification: addXP(state.gamification, XP_REWARDS.GOAL_CREATED, 'ROUTINE_CREATED') };
        }
        case 'UPDATE_ROUTINE':
            return {
                ...state,
                routines: state.routines.map(r => r.id === action.payload.id ? {
                    ...r, ...action.payload,
                    name: action.payload.name ? Sanitize.html(action.payload.name) : r.name,
                    objective: action.payload.objective !== undefined ? Sanitize.html(action.payload.objective) : r.objective,
                } : r),
            };
        case 'DELETE_ROUTINE': {
            const routineToDelete = state.routines.find(r => r.id === action.payload);
            syncManager.syncDelete('routines', action.payload);
            return {
                ...state,
                routines: state.routines.filter(r => r.id !== action.payload),
                _undoStack: [...state._undoStack, { type: 'RESTORE_ROUTINE', data: routineToDelete, timestamp: Date.now() }].slice(-10),
            };
        }
        case 'RESTORE_ROUTINE': return { ...state, routines: [...state.routines, action.payload] };
        case 'COMPLETE_ROUTINE': {
            const { id, date, xp } = action.payload;
            const routine = state.routines.find(r => r.id === id);
            if (!routine) return state;
            const completedDates = [...(routine.completedDates || []), date];
            const newStreak = calculateStreak(completedDates);
            let bonusXP = 0;
            if (newStreak === 7) bonusXP += XP_REWARDS.ROUTINE_STREAK_7;
            if (newStreak === 30) bonusXP += XP_REWARDS.ROUTINE_STREAK_30;
            const allCompleted = state.routines.every(r => r.id === id ? true : (r.completedDates || []).includes(date));
            if (allCompleted && state.routines.length > 1) bonusXP += XP_REWARDS.ALL_ROUTINES_TODAY;
            return {
                ...state,
                routines: state.routines.map(r => r.id === id ? { ...r, completedDates, streak: newStreak } : r),
                gamification: addXP(state.gamification, (xp || XP_REWARDS.ROUTINE_COMPLETE) + bonusXP, 'ROUTINE_COMPLETE'),
            };
        }

        // ── MISC ─────────────────────────────
        case 'SET_ENVELOPES': return { ...state, envelopes: action.payload };
        case 'UPDATE_PROFILE': return { ...state, profile: { ...state.profile, ...action.payload, name: action.payload.name ? Sanitize.html(action.payload.name) : state.profile.name } };

        // ── SYNC (from Realtime) ─────────────
        case 'SYNC_UPSERT': {
            const { table, item } = action.payload;
            const list = state[table] || [];
            const exists = list.some(x => x.id === item.id);
            return {
                ...state,
                [table]: exists
                    ? list.map(x => x.id === item.id ? { ...x, ...item } : x)
                    : [...list, item],
            };
        }
        case 'SYNC_REMOVE': {
            const { table, id } = action.payload;
            return { ...state, [table]: (state[table] || []).filter(x => x.id !== id) };
        }
        case 'SYNC_PROFILE': {
            const { profile, gamification, envelopes } = action.payload;
            return {
                ...state,
                profile: profile || state.profile,
                gamification: gamification || state.gamification,
                envelopes: envelopes || state.envelopes,
            };
        }

        // ── UNDO ─────────────────────────────
        case 'UNDO_LAST': {
            if (state._undoStack.length === 0) return state;
            const lastAction = state._undoStack[state._undoStack.length - 1];
            const newStack = state._undoStack.slice(0, -1);
            switch (lastAction.type) {
                case 'RESTORE_GOAL': return { ...state, goals: [...state.goals, lastAction.data], _undoStack: newStack };
                case 'RESTORE_TRANSACTION': return { ...state, transactions: [lastAction.data, ...state.transactions], _undoStack: newStack };
                case 'RESTORE_ROUTINE': return { ...state, routines: [...state.routines, lastAction.data], _undoStack: newStack };
                default: return { ...state, _undoStack: newStack };
            }
        }
        default: return state;
    }
}

// =================== PROVIDER ===================
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [prevXP, setPrevXP] = useState(0);
    const [userId, setUserId] = useState(null);
    const isFirstLoad = useRef(true);

    // ── Step 1: Instant load from localStorage ──────
    useEffect(() => {
        const localData = hydrationService.loadLocal();
        dispatch({ type: 'LOAD_DATA', payload: localData });
        setPrevXP(localData.gamification?.totalXP || 0);
    }, []);

    // ── Step 2: Listen for auth → hydrate from cloud ─
    useEffect(() => {
        if (!isSupabaseConfigured()) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const uid = session?.user?.id || null;
            setUserId(uid);

            if (uid && isFirstLoad.current) {
                isFirstLoad.current = false;

                try {
                    const { data, source, needsMigration } = await hydrationService.hydrate(uid);
                    console.log(`[AppContext] Hydrated from: ${source}, migration needed: ${needsMigration}`);

                    if (source !== 'local') {
                        // Remote or merged data — update state
                        dispatch({ type: 'LOAD_DATA', payload: data });
                        setPrevXP(data.gamification?.totalXP || 0);
                    }

                    // Initialize sync manager
                    syncManager.init(uid, dispatch);

                    // If migration needed, sync current state to cloud
                    if (needsMigration) {
                        syncManager.onStateChange({
                            ...state,
                            ...data,
                        });
                    }
                } catch (err) {
                    console.warn('[AppContext] Hydration failed, continuing with localStorage:', err.message);
                }
            } else if (uid) {
                // Re-init sync on session refresh (token renewal)
                syncManager.init(uid, dispatch);
            }
        });

        return () => {
            subscription.unsubscribe();
            syncManager.destroy();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Step 3: Persist + Sync on state change ───────
    useEffect(() => {
        if (!state.isLoaded) return;

        // Always save to localStorage (instant, reliable)
        storage.saveGoals(state.goals);
        storage.saveTransactions(state.transactions);
        storage.saveRoutines(state.routines);
        storage.saveProfile(state.profile);
        storage.set('metaflow_gamification', state.gamification);
        saveEnvelopes(state.envelopes);

        // Sync to cloud (debounced, via SyncManager)
        if (userId) {
            syncManager.onStateChange(state);
        }
    }, [state, userId]);

    // ── XP tracking ──────────────────────────────────
    const xpGained = useMemo(() =>
        state.isLoaded ? state.gamification.totalXP - prevXP : 0,
        [state.gamification.totalXP, prevXP, state.isLoaded]);

    useEffect(() => {
        if (state.gamification.totalXP !== prevXP && state.isLoaded) {
            setPrevXP(state.gamification.totalXP);
        }
    }, [state.gamification.totalXP, prevXP, state.isLoaded]);

    const undoLast = useCallback(() => dispatch({ type: 'UNDO_LAST' }), []);
    const canUndo = state._undoStack.length > 0;

    const contextValue = useMemo(() => ({
        state, dispatch, xpGained, undoLast, canUndo, userId,
    }), [state, xpGained, undoLast, canUndo, userId]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
