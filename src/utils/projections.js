// ==================================================
// SMART PROJECTIONS — Compound Interest + Pace Predictions
// ==================================================

/**
 * Calculate compound interest projection
 * @param {number} principal — Initial amount
 * @param {number} monthlyContribution — Monthly savings
 * @param {number} annualRate — Annual interest rate (e.g. 0.05 for 5%)
 * @param {number} months — Number of months
 */
export function compoundProjection(principal, monthlyContribution, annualRate, months) {
    const monthlyRate = annualRate / 12;
    let balance = principal;
    const timeline = [{ month: 0, balance, contributed: principal }];
    let totalContributed = principal;

    for (let i = 1; i <= months; i++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
        totalContributed += monthlyContribution;
        timeline.push({
            month: i,
            balance: Math.round(balance),
            contributed: totalContributed,
            interest: Math.round(balance - totalContributed),
        });
    }

    return {
        finalBalance: Math.round(balance),
        totalContributed,
        totalInterest: Math.round(balance - totalContributed),
        timeline,
    };
}

/**
 * Predict goal completion based on savings pace
 * @param {object} goal — Goal with currentAmount, targetAmount, createdAt, deadline
 * @param {array} transactions — All savings transactions
 * @returns {object} Prediction data
 */
export function predictGoalCompletion(goal, transactions) {
    const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
    if (remaining <= 0) {
        return { completed: true, message: '🎉 ¡Meta alcanzada!', daysAhead: 0 };
    }

    // Calculate average daily savings for this goal
    const goalSavings = transactions.filter(
        t => t.type === 'ahorro' && t.goalId === goal.id
    );

    if (goalSavings.length < 2) {
        return {
            completed: false,
            message: 'Necesitas más datos para una proyección precisa.',
            insufficient: true,
        };
    }

    const sortedSavings = [...goalSavings].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sortedSavings[0].date);
    const lastDate = new Date(sortedSavings[sortedSavings.length - 1].date);
    const daysSoFar = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
    const totalSaved = goalSavings.reduce((sum, t) => sum + t.amount, 0);
    const dailyAvg = totalSaved / daysSoFar;

    if (dailyAvg <= 0) {
        return { completed: false, message: 'No se detecta un ritmo de ahorro constante.', insufficient: true };
    }

    const daysToComplete = Math.ceil(remaining / dailyAvg);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysToComplete);

    const deadline = new Date(goal.deadline);
    const daysUntilDeadline = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    const daysAhead = daysUntilDeadline - daysToComplete;

    let message;
    if (daysAhead > 30) {
        message = `🚀 ¡Vas ${Math.abs(daysAhead)} días adelantado! Al ritmo actual, completarás tu meta antes de lo planeado.`;
    } else if (daysAhead > 0) {
        message = `⚡ ¡Buen ritmo! Terminarás ${daysAhead} días antes del plazo.`;
    } else if (daysAhead === 0) {
        message = `🎯 Vas perfecto — justo a tiempo con tu deadline.`;
    } else {
        message = `⚠️ Al ritmo actual, te tomará ${Math.abs(daysAhead)} días más del plazo. ¡Ajusta tu ahorro diario!`;
    }

    return {
        completed: false,
        dailyAvg: Math.round(dailyAvg),
        weeklyAvg: Math.round(dailyAvg * 7),
        monthlyAvg: Math.round(dailyAvg * 30),
        daysToComplete,
        projectedDate: projectedDate.toISOString(),
        daysAhead,
        onTrack: daysAhead >= 0,
        message,
    };
}

/**
 * Generate savings growth projection for a goal
 * Used for showing chart projections
 */
export function generateGoalProjection(goal, monthlyRate = 0) {
    const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const monthsLeft = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyNeeded = remaining / monthsLeft;

    return compoundProjection(goal.currentAmount || 0, monthlyNeeded, monthlyRate, monthsLeft);
}

/**
 * Quick pace status for a goal — returns 'ahead', 'on-track', or 'behind'
 */
export function getGoalPaceStatus(goal) {
    if (!goal || !goal.deadline || !goal.targetAmount) return 'unknown';

    const progress = (goal.currentAmount || 0) / goal.targetAmount;
    const now = new Date();
    const created = new Date(goal.createdAt || now);
    const deadline = new Date(goal.deadline);

    const totalDuration = deadline - created;
    const elapsed = now - created;
    const expectedProgress = totalDuration > 0 ? elapsed / totalDuration : 0;

    if (progress >= 1) return 'completed';
    if (progress >= expectedProgress * 1.1) return 'ahead';
    if (progress >= expectedProgress * 0.9) return 'on-track';
    return 'behind';
}
