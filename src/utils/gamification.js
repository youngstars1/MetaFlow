// ============================================
// MOTOR DE GAMIFICACIÓN – XP, Niveles, Medallas y Streaks
// Sistema de Disciplina MetaFlow v3.0
// ============================================

export const XP_REWARDS = {
    ROUTINE_COMPLETE: 20,
    ROUTINE_STREAK_7: 100,
    ROUTINE_STREAK_30: 500,
    ROUTINE_STREAK_60: 1000,
    ROUTINE_STREAK_100: 2500,
    GOAL_CREATED: 20,
    GOAL_COMPLETED: 500,
    FIRST_GOAL: 50,
    SAVINGS_REGISTERED: 25,
    TRANSACTION_LOGGED: 10,
    FIRST_TRANSACTION: 30,
    ALL_ROUTINES_TODAY: 100,
    BACKUP_CREATED: 15,
    PROFILE_COMPLETED: 50,
    ENVELOPE_CONFIGURED: 30,
};

const LEVEL_THRESHOLDS = [
    0, 200, 500, 1000, 1800, 3000, 5000, 8000, 12000, 18000,
    25000, 35000, 50000, 70000, 100000, 150000, 250000, 500000
];

const LEVEL_TITLES = [
    'Iniciado',
    'Planificador',
    'Estratega',
    'Gestor Financiero',
    'Arquitecto de Ahorro',
    'Maestro del Presupuesto',
    'Ahorrador Visionario',
    'Experto en Capital',
    'Líder Patrimonial',
    'Mentor Financiero',
    'Titán del Ahorro',
    'Consultor Senior',
    'Director de Activos',
    'Gobernador Financiero',
    'Leyenda del Ahorro',
    'Maestro de la Disciplina',
    'Autoridad Financiera',
    'Sabio del Patrimonio'
];

export function calculateLevel(totalXP) {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            break;
        }
    }
    return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function getXPForNextLevel(totalXP) {
    const currentLevel = calculateLevel(totalXP);
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
        return { current: totalXP, needed: totalXP, progress: 100 };
    }

    const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
    const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold;
    const progressXP = totalXP - currentThreshold;
    const neededXP = nextThreshold - currentThreshold;
    const progress = neededXP > 0 ? Math.min(100, Math.round((progressXP / neededXP) * 100)) : 100;

    return {
        current: progressXP,
        needed: neededXP,
        nextThreshold,
        progress,
    };
}

export function getLevelTitle(level) {
    return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] || 'Iniciado';
}

export function getLevelIcon(level) {
    if (level >= 15) return '🏛️';
    if (level >= 12) return '💎';
    if (level >= 9) return '🔥';
    if (level >= 6) return '⚡';
    if (level >= 3) return '🎯';
    return '🌱';
}

// ===================== BADGES =====================
export const BADGES = [
    // --- DISCIPLINE ---
    {
        id: 'first_step',
        name: 'Primer Paso',
        description: 'Creaste tu primera meta financiera',
        icon: 'Zap',
        category: 'discipline',
        condition: (state) => state.goals.length >= 1,
    },
    {
        id: 'discipline_iron',
        name: 'Disciplina de Hierro',
        description: '7 días seguidos cumpliendo hábitos',
        icon: 'ShieldCheck',
        category: 'discipline',
        condition: (state) => state.routines.some(r => (r.streak || 0) >= 7),
    },
    {
        id: 'discipline_steel',
        name: 'Voluntad de Acero',
        description: '30 días seguidos de consistencia',
        icon: 'Shield',
        category: 'discipline',
        condition: (state) => state.routines.some(r => (r.streak || 0) >= 30),
    },
    {
        id: 'discipline_diamond',
        name: 'Mentalidad Diamante',
        description: '60 días de racha ininterrumpida',
        icon: 'Gem',
        category: 'discipline',
        condition: (state) => state.routines.some(r => (r.streak || 0) >= 60),
    },
    // --- WEALTH ---
    {
        id: 'saver_100k',
        name: 'Centenario',
        description: 'Ahorraste más de $100.000 en una meta',
        icon: 'TrendingUp',
        category: 'wealth',
        condition: (state) => state.goals.some(g => (g.currentAmount || 0) >= 100000),
    },
    {
        id: 'saver_500k',
        name: 'Medio Millón',
        description: '$500.000 acumulados en una sola meta',
        icon: 'Wallet',
        category: 'wealth',
        condition: (state) => state.goals.some(g => (g.currentAmount || 0) >= 500000),
    },
    {
        id: 'saver_1m',
        name: 'Club del Millón',
        description: '¡Tu primera meta con $1.000.000+ ahorrados!',
        icon: 'Crown',
        category: 'wealth',
        condition: (state) => state.goals.some(g => (g.currentAmount || 0) >= 1000000),
    },
    {
        id: 'goal_completed',
        name: 'Meta Conquistada',
        description: 'Completaste una meta al 100%',
        icon: 'Trophy',
        category: 'wealth',
        condition: (state) => state.goals.some(g =>
            g.targetAmount > 0 && (g.currentAmount || 0) >= g.targetAmount
        ),
    },
    // --- INTELLIGENCE ---
    {
        id: 'data_tracker',
        name: 'Rastreador',
        description: 'Registraste más de 20 transacciones',
        icon: 'Activity',
        category: 'intelligence',
        condition: (state) => state.transactions.length >= 20,
    },
    {
        id: 'data_master',
        name: 'Control Total',
        description: '50+ transacciones registradas con precisión',
        icon: 'BarChart3',
        category: 'intelligence',
        condition: (state) => state.transactions.length >= 50,
    },
    {
        id: 'multi_target',
        name: 'Multi-Objetivo',
        description: 'Tienes 3 o más metas activas simultáneamente',
        icon: 'Target',
        category: 'intelligence',
        condition: (state) => state.goals.length >= 3,
    },
    {
        id: 'habit_builder',
        name: 'Arquitecto de Hábitos',
        description: '5 o más rutinas configuradas',
        icon: 'Layers',
        category: 'intelligence',
        condition: (state) => state.routines.length >= 5,
    },
];

export function evaluateBadges(state) {
    return BADGES.map(badge => ({
        ...badge,
        earned: badge.condition(state),
    }));
}

export function countEarnedBadges(state) {
    return BADGES.filter(badge => badge.condition(state)).length;
}

export function getNewlyEarnedBadges(state, previousBadgeIds = []) {
    return BADGES.filter(
        badge => badge.condition(state) && !previousBadgeIds.includes(badge.id)
    );
}
