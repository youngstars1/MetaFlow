import { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { generateId } from '../utils/helpers';
import { XP_REWARDS, calculateLevel, evaluateBadges } from '../utils/gamification';
import { Finance, Sanitize } from '../utils/security';
import { repository } from '../lib/repository';
import { getEnvelopes, saveEnvelopes } from '../utils/envelopes';

const AppContext = createContext();

const initialState = {
    goals: [],
    transactions: [],
    routines: [],
    envelopes: { enabled: false, rules: [] },
    profile: {
        name: '',
        email: '',
        incomeSources: [],
        currency: 'CLP',
    },
    gamification: {
        totalXP: 0,
        xpLog: [],
        earnedBadgeIds: [],
    },
    isLoaded: false,
    _undoStack: [],
    _syncing: false,
};

function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkStr = checkDate.toDateString();
        if (sorted.includes(checkStr)) {
            streak++;
        } else if (i === 0) {
            // Today not completed yet, that's ok, keep checking yesterday
            continue;
        } else {
            break;
        }
    }
    return streak;
}

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, _syncing: action.payload };

        case 'LOAD_DATA':
            return { ...state, ...action.payload, isLoaded: true };

        case 'SET_USER_ID':
            repository.setUserId(action.payload);
            return state;

        // =================== GOALS ===================
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
            return {
                ...state,
                goals: [...state.goals, sanitized],
                gamification: addXP(state.gamification, xpGain, 'GOAL_CREATED'),
            };
        }

        case 'UPDATE_GOAL':
            return {
                ...state,
                goals: state.goals.map(g => g.id === action.payload.id ? {
                    ...g,
                    ...action.payload,
                    name: action.payload.name ? Sanitize.html(action.payload.name) : g.name,
                    description: action.payload.description !== undefined ? Sanitize.html(action.payload.description) : g.description,
                    targetAmount: action.payload.targetAmount !== undefined ? Finance.parse(action.payload.targetAmount) : g.targetAmount,
                } : g),
            };

        case 'DELETE_GOAL':
            return {
                ...state,
                goals: state.goals.filter(g => g.id !== action.payload),
                _undoStack: [...state._undoStack, {
                    type: 'RESTORE_GOAL',
                    data: state.goals.find(g => g.id === action.payload),
                    timestamp: Date.now(),
                }].slice(-10),
            };

        case 'RESTORE_GOAL':
            return {
                ...state,
                goals: [...state.goals, action.payload],
            };

        case 'ADD_SAVINGS_TO_GOAL': {
            const { goalId, amount } = action.payload;
            const parsedAmount = Finance.parse(amount);
            let extraXP = 0;

            const goal = state.goals.find(g => g.id === goalId);
            if (!goal) return state;

            const oldAmount = Finance.parse(goal.currentAmount || 0);
            const newAmount = Finance.add(oldAmount, parsedAmount);
            const progress = goal.targetAmount > 0 ? (newAmount / goal.targetAmount) * 100 : 0;

            if (oldAmount < goal.targetAmount && newAmount >= goal.targetAmount) {
                extraXP += XP_REWARDS.GOAL_COMPLETED;
            }

            return {
                ...state,
                goals: state.goals.map(g =>
                    g.id === goalId ? { ...g, currentAmount: newAmount } : g
                ),
                gamification: addXP(state.gamification, XP_REWARDS.SAVINGS_REGISTERED + extraXP, 'SAVINGS_REGISTERED'),
            };
        }

        // =================== TRANSACTIONS ===================
        case 'ADD_TRANSACTION': {
            const sanitized = {
                ...action.payload,
                id: generateId(),
                note: Sanitize.html(action.payload.note),
                amount: Finance.parse(action.payload.amount),
            };
            const xpGain = state.transactions.length === 0 ? XP_REWARDS.FIRST_TRANSACTION + XP_REWARDS.TRANSACTION_LOGGED : XP_REWARDS.TRANSACTION_LOGGED;

            return {
                ...state,
                transactions: [sanitized, ...state.transactions],
                gamification: addXP(state.gamification, xpGain, 'TRANSACTION_LOGGED'),
            };
        }

        case 'DELETE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.filter(t => t.id !== action.payload),
                _undoStack: [...state._undoStack, {
                    type: 'RESTORE_TRANSACTION',
                    data: state.transactions.find(t => t.id === action.payload),
                    timestamp: Date.now(),
                }].slice(-10),
            };

        case 'RESTORE_TRANSACTION':
            return {
                ...state,
                transactions: [action.payload, ...state.transactions],
            };

        // =================== ROUTINES ===================
        case 'ADD_ROUTINE': {
            const newRoutine = {
                ...action.payload,
                id: action.payload.id || generateId(),
                name: Sanitize.html(action.payload.name),
                objective: action.payload.objective ? Sanitize.html(action.payload.objective) : '',
                streak: 0,
                completedDates: [],
                createdAt: new Date().toISOString(),
            };
            return {
                ...state,
                routines: [...state.routines, newRoutine],
                gamification: addXP(state.gamification, XP_REWARDS.GOAL_CREATED, 'ROUTINE_CREATED'),
            };
        }

        case 'UPDATE_ROUTINE':
            return {
                ...state,
                routines: state.routines.map(r => r.id === action.payload.id ? {
                    ...r,
                    ...action.payload,
                    name: action.payload.name ? Sanitize.html(action.payload.name) : r.name,
                    objective: action.payload.objective !== undefined ? Sanitize.html(action.payload.objective) : r.objective,
                } : r),
            };

        case 'DELETE_ROUTINE':
            return {
                ...state,
                routines: state.routines.filter(r => r.id !== action.payload),
                _undoStack: [...state._undoStack, {
                    type: 'RESTORE_ROUTINE',
                    data: state.routines.find(r => r.id === action.payload),
                    timestamp: Date.now(),
                }].slice(-10),
            };

        case 'RESTORE_ROUTINE':
            return {
                ...state,
                routines: [...state.routines, action.payload],
            };

        case 'COMPLETE_ROUTINE': {
            const { id, date, xp } = action.payload;
            const routine = state.routines.find(r => r.id === id);
            if (!routine) return state;

            const completedDates = [...(routine.completedDates || []), date];
            const newStreak = calculateStreak(completedDates);

            let bonusXP = 0;
            if (newStreak === 7) bonusXP += XP_REWARDS.ROUTINE_STREAK_7;
            if (newStreak === 30) bonusXP += XP_REWARDS.ROUTINE_STREAK_30;

            // Check if ALL routines completed today
            const allCompleted = state.routines.every(r => {
                if (r.id === id) return true;
                return (r.completedDates || []).includes(date);
            });
            if (allCompleted && state.routines.length > 1) {
                bonusXP += XP_REWARDS.ALL_ROUTINES_TODAY;
            }

            return {
                ...state,
                routines: state.routines.map(r =>
                    r.id === id ? { ...r, completedDates, streak: newStreak } : r
                ),
                gamification: addXP(state.gamification, (xp || XP_REWARDS.ROUTINE_COMPLETE) + bonusXP, 'ROUTINE_COMPLETE'),
            };
        }

        // =================== ENVELOPES ===================
        case 'SET_ENVELOPES':
            return { ...state, envelopes: action.payload };

        // =================== PROFILE ===================
        case 'UPDATE_PROFILE':
            return { ...state, profile: { ...state.profile, ...action.payload, name: action.payload.name ? Sanitize.html(action.payload.name) : state.profile.name } };

        case 'SYNC_STATE':
            return { ...state, ...action.payload };

        // =================== UNDO ===================
        case 'UNDO_LAST': {
            if (state._undoStack.length === 0) return state;
            const lastAction = state._undoStack[state._undoStack.length - 1];
            const newStack = state._undoStack.slice(0, -1);

            switch (lastAction.type) {
                case 'RESTORE_GOAL':
                    return { ...state, goals: [...state.goals, lastAction.data], _undoStack: newStack };
                case 'RESTORE_TRANSACTION':
                    return { ...state, transactions: [lastAction.data, ...state.transactions], _undoStack: newStack };
                case 'RESTORE_ROUTINE':
                    return { ...state, routines: [...state.routines, lastAction.data], _undoStack: newStack };
                default:
                    return { ...state, _undoStack: newStack };
            }
        }

        default:
            return state;
    }
}

function addXP(gamification, amount, action) {
    if (amount <= 0) return gamification;
    return {
        ...gamification,
        totalXP: (gamification.totalXP || 0) + amount,
        xpLog: [
            { action, xp: amount, timestamp: Date.now() },
            ...(gamification.xpLog || []),
        ].slice(0, 100),
    };
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [prevXP, setPrevXP] = useState(0);

    // Initial hydration
    useEffect(() => {
        const goals = storage.getGoals();
        const transactions = storage.getTransactions();
        const routines = storage.getRoutines();
        const profile = storage.getProfile();
        const gamification = storage.get('metaflow_gamification') || initialState.gamification;
        const envelopes = getEnvelopes();

        dispatch({
            type: 'LOAD_DATA',
            payload: { goals, transactions, routines, profile, gamification, envelopes },
        });
        setPrevXP(gamification.totalXP || 0);
    }, []);

    // Persistence Effect
    useEffect(() => {
        if (!state.isLoaded) return;

        storage.saveGoals(state.goals);
        storage.saveTransactions(state.transactions);
        storage.saveRoutines(state.routines);
        storage.saveProfile(state.profile);
        storage.set('metaflow_gamification', state.gamification);
        saveEnvelopes(state.envelopes);
    }, [state]);

    /**
     * OPTIMISTIC ACTION WRAPPER
     */
    const performAction = useCallback(async (type, payload, repoMethod) => {
        const backupState = { ...state };

        dispatch({ type, payload });

        if (repoMethod) {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                await repoMethod(payload);
            } catch (error) {
                console.error("Action failed, rolling back:", error);
                dispatch({ type: 'SYNC_STATE', payload: backupState });
                throw error;
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        }
    }, [state]);

    const xpGained = useMemo(() =>
        state.isLoaded ? state.gamification.totalXP - prevXP : 0,
        [state.gamification.totalXP, prevXP, state.isLoaded]);

    useEffect(() => {
        if (state.gamification.totalXP !== prevXP && state.isLoaded) {
            setPrevXP(state.gamification.totalXP);
        }
    }, [state.gamification.totalXP, prevXP, state.isLoaded]);

    // Undo action helper
    const undoLast = useCallback(() => {
        dispatch({ type: 'UNDO_LAST' });
    }, []);

    const canUndo = state._undoStack.length > 0;

    const contextValue = useMemo(() => ({
        state,
        dispatch,
        performAction,
        xpGained,
        undoLast,
        canUndo,
    }), [state, performAction, xpGained, undoLast, canUndo]);

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
