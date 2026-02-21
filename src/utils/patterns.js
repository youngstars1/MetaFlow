// ==================================================
// PATTERN DETECTION ENGINE — Inteligencia Financiera
// Detecta patrones de gasto, sugiere mejoras
// ==================================================

import { time } from './timeEngine';

/**
 * Expense Classification Types
 */
export const EXPENSE_TYPES = {
    NECESSITY: { key: 'necessity', label: 'Necesidad', color: '#00f5d4', icon: 'ShieldCheck' },
    INVESTMENT: { key: 'investment', label: 'Inversión', color: '#70d6ff', icon: 'TrendingUp' },
    DESIRE: { key: 'desire', label: 'Deseo', color: '#ffbe0b', icon: 'Heart' },
    IMPULSE: { key: 'impulse', label: 'Impulso', color: '#ff5d5d', icon: 'Zap' },
};

/**
 * Auto-classify an expense based on its category
 */
export function classifyExpense(category) {
    const map = {
        // Necessities
        alimentacion: 'necessity',
        transporte: 'necessity',
        servicios: 'necessity',
        salud: 'necessity',
        hogar: 'necessity',
        // Investments
        educacion: 'investment',
        inversiones: 'investment',
        ahorro_meta: 'investment',
        // Desires
        entretenimiento: 'desire',
        ropa: 'desire',
        // Default to impulse
    };
    return map[category] || 'impulse';
}

/**
 * Calculate financial decision metrics
 */
export function calculateDecisionMetrics(transactions) {
    const expenses = transactions.filter(t => t.type === 'gasto' || t.type === 'expense');
    if (expenses.length === 0) {
        return {
            impulseIndex: 0,
            investmentRatio: 0,
            optimizationLevel: 0,
            breakdown: { necessity: 0, investment: 0, desire: 0, impulse: 0 },
            insights: [],
        };
    }

    const breakdown = { necessity: 0, investment: 0, desire: 0, impulse: 0 };
    let total = 0;

    expenses.forEach(t => {
        const classification = t.classification || classifyExpense(t.category);
        const amount = Math.abs(t.amount);
        breakdown[classification] = (breakdown[classification] || 0) + amount;
        total += amount;
    });

    const impulseIndex = total > 0 ? Math.round((breakdown.impulse / total) * 100) : 0;
    const investmentRatio = total > 0 ? Math.round((breakdown.investment / total) * 100) : 0;

    // Optimization = low impulse + high investment + balanced necessities
    const necessityRatio = total > 0 ? breakdown.necessity / total : 0;
    const optimizationLevel = Math.min(100, Math.round(
        (investmentRatio * 0.4) +
        ((100 - impulseIndex) * 0.4) +
        (necessityRatio < 0.6 ? 20 : necessityRatio < 0.8 ? 10 : 0)
    ));

    const insights = generateInsights(breakdown, total, impulseIndex, investmentRatio);

    return {
        impulseIndex,
        investmentRatio,
        optimizationLevel,
        breakdown,
        total,
        insights,
    };
}

/**
 * Generate smart insights from spending data
 */
function generateInsights(breakdown, total, impulseIndex, investmentRatio) {
    const insights = [];

    if (impulseIndex > 30) {
        insights.push({
            type: 'warning',
            icon: 'AlertTriangle',
            message: `${impulseIndex}% de tus gastos son impulsivos. Intenta esperar 24h antes de compras no planificadas.`,
        });
    } else if (impulseIndex < 10) {
        insights.push({
            type: 'success',
            icon: 'ShieldCheck',
            message: 'Excelente control de impulsos. Tu disciplina financiera es de nivel senior.',
        });
    }

    if (investmentRatio > 20) {
        insights.push({
            type: 'success',
            icon: 'TrendingUp',
            message: `${investmentRatio}% destinado a inversión. Estás construyendo patrimonio activamente.`,
        });
    } else if (investmentRatio < 5 && total > 0) {
        insights.push({
            type: 'info',
            icon: 'Info',
            message: 'Considera destinar al menos 10% de tus gastos a inversión o educación.',
        });
    }

    return insights;
}

/**
 * Detect spending patterns by day of week
 */
export function detectDayPatterns(transactions) {
    const expenses = transactions.filter(t => t.type === 'gasto' || t.type === 'expense');
    if (expenses.length < 7) return [];

    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

    expenses.forEach(t => {
        const day = new Date(t.date || t.createdAt).getDay();
        dayTotals[day] += Math.abs(t.amount);
        dayCounts[day]++;
    });

    const patterns = [];
    const avgPerDay = dayTotals.reduce((s, v) => s + v, 0) / 7;

    dayTotals.forEach((total, i) => {
        if (total > avgPerDay * 1.5 && dayCounts[i] >= 2) {
            const percent = Math.round(((total - avgPerDay) / avgPerDay) * 100);
            patterns.push({
                type: 'day_spike',
                message: `Tus gastos suben ${percent}% los ${dayNames[i]}.`,
                day: i,
                dayName: dayNames[i],
                amount: total,
                icon: 'Calendar',
            });
        }
    });

    return patterns;
}

/**
 * Detect category growth trends (month-over-month)
 */
export function detectCategoryTrends(transactions) {
    const expenses = transactions.filter(t => t.type === 'gasto' || t.type === 'expense');
    if (expenses.length < 5) return [];

    const now = time.now();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthByCategory = {};
    const lastMonthByCategory = {};

    expenses.forEach(t => {
        const d = new Date(t.date || t.createdAt);
        const cat = t.category || 'otros';
        const amount = Math.abs(t.amount);

        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            thisMonthByCategory[cat] = (thisMonthByCategory[cat] || 0) + amount;
        } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
            lastMonthByCategory[cat] = (lastMonthByCategory[cat] || 0) + amount;
        }
    });

    const trends = [];
    Object.keys(thisMonthByCategory).forEach(cat => {
        const thisAmount = thisMonthByCategory[cat];
        const lastAmount = lastMonthByCategory[cat] || 0;
        if (lastAmount > 0) {
            const change = Math.round(((thisAmount - lastAmount) / lastAmount) * 100);
            if (Math.abs(change) >= 15) {
                trends.push({
                    type: change > 0 ? 'increase' : 'decrease',
                    category: cat,
                    change,
                    message: `Categoría ${cat} ${change > 0 ? 'aumentó' : 'disminuyó'} ${Math.abs(change)}% este mes.`,
                    icon: change > 0 ? 'TrendingUp' : 'TrendingDown',
                });
            }
        }
    });

    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
}

/**
 * Generate daily missions based on user state
 */
export function generateDailyMissions(state) {
    const missions = [];
    const today = time.todayString();

    // Mission 1: Register an expense
    const todayTransactions = state.transactions.filter(t => {
        const d = new Date(t.date || t.createdAt);
        return d.toDateString() === today;
    });
    const hasExpenseToday = todayTransactions.some(t => t.type === 'gasto' || t.type === 'expense');

    missions.push({
        id: 'register_expense',
        title: 'Registra un gasto',
        description: 'Mantén tu registro al día para mejores métricas',
        xp: 10,
        difficulty: 'fácil',
        completed: hasExpenseToday,
        icon: 'Receipt',
    });

    // Mission 2: Complete all routines
    const allRoutinesCompleted = state.routines.length > 0 && state.routines.every(r =>
        (r.completedDates || []).includes(today)
    );
    missions.push({
        id: 'complete_routines',
        title: 'Completa todas tus rutinas',
        description: 'La consistencia construye el carácter financiero',
        xp: 100,
        difficulty: 'media',
        completed: allRoutinesCompleted,
        icon: 'CheckCircle',
    });

    // Mission 3: Save money
    const hasSavingsToday = todayTransactions.some(t => t.type === 'ahorro' || t.type === 'savings');
    missions.push({
        id: 'save_money',
        title: 'Ahorra $1.000 extra',
        description: 'Cada peso cuenta para tus metas',
        xp: 25,
        difficulty: 'media',
        completed: hasSavingsToday,
        icon: 'PiggyBank',
    });

    // Mission 4: No impulse spending
    const hasImpulseToday = todayTransactions.some(t => {
        if (t.type !== 'gasto' && t.type !== 'expense') return false;
        const cls = t.classification || classifyExpense(t.category);
        return cls === 'impulse';
    });
    missions.push({
        id: 'no_impulse',
        title: 'Día sin gastos impulsivos',
        description: 'Demuestra control sobre tus finanzas',
        xp: 50,
        difficulty: 'difícil',
        completed: !hasImpulseToday && todayTransactions.length > 0,
        icon: 'Shield',
    });

    return missions;
}
