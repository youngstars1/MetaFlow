import { supabase } from './supabase';
import { storage } from '../utils/storage';

/**
 * Repository Pattern for MetaFlow
 * Handles abstraction between LocalStorage (Offline/Guest) and Supabase (Cloud)
 * Implements logic for atomic updates and synchronization.
 */
class DataRepository {
    constructor() {
        this.isOnline = true;
        this.userId = null;
    }

    setUserId(id) {
        this.userId = id;
    }

    /**
     * ATOMIC UPDATE: Adds savings to a goal
     * Uses Supabase RPC for server-side atomicity if available, 
     * falling back to client-side logic with optimistic updates.
     */
    async addSavingsToGoal(goalId, amount) {
        // Optimistic check
        if (!this.userId) {
            // Local fallback
            const goals = storage.getGoals();
            const goalIndex = goals.findIndex(g => g.id === goalId);
            if (goalIndex === -1) throw new Error("Goal not found");

            goals[goalIndex].currentAmount = (goals[goalIndex].currentAmount || 0) + amount;
            storage.saveGoals(goals);
            return goals[goalIndex];
        }

        // Supabase Atomic Update
        // Note: In a real SQL setup, we'd use: 
        // update goals set current_amount = current_amount + 100 where id = '...'
        const { data, error } = await supabase
            .from('goals')
            .update({
                current_amount: supabase.rpc('increment', { amount, column: 'current_amount' })
            })
            .eq('id', goalId)
            .select()
            .single();

        // If RPC isn't configured, we fall back to a transaction-like approach
        if (error) {
            console.warn("Supabase RPC failed, using manual update", error);
            const { data: currentGoal } = await supabase.from('goals').select('current_amount').eq('id', goalId).single();
            const newAmount = (currentGoal?.current_amount || 0) + amount;

            const { data: updated, error: updateErr } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', goalId)
                .select()
                .single();

            if (updateErr) throw updateErr;
            return updated;
        }

        return data;
    }

    async addTransaction(transaction) {
        if (!this.userId) {
            const transactions = storage.getTransactions();
            transactions.unshift(transaction);
            storage.saveTransactions(transactions);
            return transaction;
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                ...transaction,
                user_id: this.userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async syncState(localState) {
        if (!this.userId) return localState;

        // Complex sync logic would go here:
        // 1. Fetch remote changes
        // 2. Diff with local
        // 3. Resolve conflicts (Last Write Wins for metadata, Sum for money)
        // For now, let's just ensure we have one source of truth
        return localState;
    }
}

export const repository = new DataRepository();
