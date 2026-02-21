/**
 * DataRepository — Centralized data access layer
 * 
 * ALL Supabase reads/writes go through this class.
 * The UI NEVER talks to Supabase directly.
 * 
 * Responsibilities:
 * - CRUD operations per table
 * - camelCase ↔ snake_case mapping
 * - Null-safety on all fields
 * - Error wrapping with consistent return shape
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ── Field Mappers ─────────────────────────────────

const goalToDb = (g, userId) => ({
    id: g.id,
    user_id: userId,
    name: g.name || '',
    description: g.description || '',
    target_amount: Number(g.targetAmount) || 0,
    current_amount: Number(g.currentAmount) || 0,
    deadline: g.deadline || null,
    priority: g.priority || 'medium',
    color: g.color || '#00e5c3',
    image_url: g.imageUrl || null,
    is_deleted: false,
    updated_at: new Date().toISOString(),
});

const goalFromDb = (g) => ({
    id: g.id,
    name: g.name || '',
    description: g.description || '',
    targetAmount: Number(g.target_amount) || 0,
    currentAmount: Number(g.current_amount) || 0,
    deadline: g.deadline || null,
    priority: g.priority || 'medium',
    color: g.color || '#00e5c3',
    imageUrl: g.image_url || null,
    version: g.version || 1,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
});

const txToDb = (t, userId) => ({
    id: t.id,
    user_id: userId,
    type: t.type || 'gasto',
    amount: Number(t.amount) || 0,
    category: t.category || '',
    note: t.note || '',
    date: t.date || new Date().toISOString().split('T')[0],
    goal_id: t.goalId || null,
    decision_type: t.decisionType || null,
    is_deleted: false,
    updated_at: new Date().toISOString(),
});

const txFromDb = (t) => ({
    id: t.id,
    type: t.type || 'gasto',
    amount: Number(t.amount) || 0,
    category: t.category || '',
    note: t.note || '',
    date: t.date || '',
    goalId: t.goal_id || null,
    decisionType: t.decision_type || null,
    version: t.version || 1,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
});

const routineToDb = (r, userId) => ({
    id: r.id,
    user_id: userId,
    name: r.name || '',
    objective: r.objective || '',
    category: r.category || 'finanzas',
    frequency: r.frequency || 'daily',
    difficulty: r.difficulty || 'medium',
    xp_value: Number(r.xpValue) || 20,
    completed_dates: Array.isArray(r.completedDates) ? r.completedDates : [],
    streak: Number(r.streak) || 0,
    is_deleted: false,
    updated_at: new Date().toISOString(),
});

const routineFromDb = (r) => ({
    id: r.id,
    name: r.name || '',
    objective: r.objective || '',
    category: r.category || 'finanzas',
    frequency: r.frequency || 'daily',
    difficulty: r.difficulty || 'medium',
    xpValue: Number(r.xp_value) || 20,
    completedDates: Array.isArray(r.completed_dates) ? r.completed_dates : [],
    streak: Number(r.streak) || 0,
    version: r.version || 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
});

const profileToDb = (p, gamification, envelopes, userId) => ({
    user_id: userId,
    name: p.name || '',
    currency: p.currency || 'CLP',
    income_sources: Array.isArray(p.incomeSources) ? p.incomeSources : [],
    gamification: gamification || { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
    envelopes: envelopes || { enabled: false, rules: [] },
    updated_at: new Date().toISOString(),
});

const profileFromDb = (p) => ({
    profile: {
        name: p.name || '',
        currency: p.currency || 'CLP',
        incomeSources: Array.isArray(p.income_sources) ? p.income_sources : [],
    },
    gamification: p.gamification && typeof p.gamification === 'object'
        ? {
            totalXP: Number(p.gamification.totalXP) || 0,
            xpLog: Array.isArray(p.gamification.xpLog) ? p.gamification.xpLog : [],
            earnedBadgeIds: Array.isArray(p.gamification.earnedBadgeIds) ? p.gamification.earnedBadgeIds : [],
        }
        : { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
    envelopes: p.envelopes && typeof p.envelopes === 'object'
        ? p.envelopes
        : { enabled: false, rules: [] },
    version: p.version || 1,
    updatedAt: p.updated_at,
});

// ── Repository Class ──────────────────────────────

class DataRepository {
    get configured() {
        return isSupabaseConfigured();
    }

    // ── Goals ────────────────────────────

    async fetchGoals(userId) {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at');

        if (error) throw new Error(`fetchGoals: ${error.message}`);
        return (data || []).map(goalFromDb);
    }

    goalToPayload(goal, userId) {
        return goalToDb(goal, userId);
    }

    // ── Transactions ─────────────────────

    async fetchTransactions(userId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`fetchTransactions: ${error.message}`);
        return (data || []).map(txFromDb);
    }

    txToPayload(tx, userId) {
        return txToDb(tx, userId);
    }

    // ── Routines ─────────────────────────

    async fetchRoutines(userId) {
        const { data, error } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at');

        if (error) throw new Error(`fetchRoutines: ${error.message}`);
        return (data || []).map(routineFromDb);
    }

    routineToPayload(routine, userId) {
        return routineToDb(routine, userId);
    }

    // ── Profile ──────────────────────────

    async fetchProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // No row is not an error for profiles — user might be new
        if (error && error.code !== 'PGRST116') {
            throw new Error(`fetchProfile: ${error.message}`);
        }

        return data ? profileFromDb(data) : null;
    }

    profileToPayload(profile, gamification, envelopes, userId) {
        return profileToDb(profile, gamification, envelopes, userId);
    }

    // ── Fetch All ────────────────────────

    async fetchAll(userId) {
        const [goals, transactions, routines, profileData] = await Promise.all([
            this.fetchGoals(userId),
            this.fetchTransactions(userId),
            this.fetchRoutines(userId),
            this.fetchProfile(userId),
        ]);

        return {
            goals,
            transactions,
            routines,
            profile: profileData?.profile || { name: '', currency: 'CLP', incomeSources: [] },
            gamification: profileData?.gamification || { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
            envelopes: profileData?.envelopes || { enabled: false, rules: [] },
        };
    }
}

// Singleton
export const dataRepository = new DataRepository();

// Export mappers for WriteQueue usage
export const mappers = {
    goalToDb,
    goalFromDb,
    txToDb,
    txFromDb,
    routineToDb,
    routineFromDb,
    profileToDb,
    profileFromDb,
};
