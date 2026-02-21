// ==================================================
// TIME ENGINE — Motor Temporal Centralizado MetaFlow
// Ingeniería limpia: un solo punto de verdad temporal
// ==================================================

class TimeEngine {
    constructor() {
        this._offset = 0; // ms offset for simulation/testing
    }

    /**
     * Current timestamp (supports simulation offset)
     */
    now() {
        return new Date(Date.now() + this._offset);
    }

    /**
     * Today as Date (midnight)
     */
    today() {
        const d = this.now();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Today as string for comparison (e.g. "Fri Feb 21 2026")
     */
    todayString() {
        return this.now().toDateString();
    }

    /**
     * Start of current week (Monday)
     */
    startOfWeek() {
        const d = this.today();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d;
    }

    /**
     * Start of current month
     */
    startOfMonth() {
        const d = this.now();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    /**
     * End of current month
     */
    endOfMonth() {
        const d = this.now();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    }

    /**
     * Check if two dates are the same calendar day
     */
    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.toDateString() === d2.toDateString();
    }

    /**
     * Check if a date is today
     */
    isToday(date) {
        return this.isSameDay(date, this.now());
    }

    /**
     * Days between two dates (absolute)
     */
    diffInDays(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.abs(Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    }

    /**
     * Business days between two dates (excludes weekends)
     */
    diffInBusinessDays(date1, date2) {
        let start = new Date(Math.min(new Date(date1), new Date(date2)));
        const end = new Date(Math.max(new Date(date1), new Date(date2)));
        let count = 0;
        while (start <= end) {
            const day = start.getDay();
            if (day !== 0 && day !== 6) count++;
            start.setDate(start.getDate() + 1);
        }
        return count;
    }

    /**
     * Days remaining until a target date
     */
    daysUntil(targetDate) {
        const now = this.now();
        const target = new Date(targetDate);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }

    /**
     * Days elapsed since a date
     */
    daysSince(date) {
        const now = this.now();
        const d = new Date(date);
        return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
    }

    /**
     * Get day of week name in Spanish
     */
    dayName(date) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[new Date(date).getDay()];
    }

    /**
     * Get short day name
     */
    dayNameShort(date) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[new Date(date).getDay()];
    }

    /**
     * Format as relative time ("hace 3 días", "hoy", "ayer")
     */
    relative(date) {
        const d = new Date(date);
        const now = this.now();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMins = Math.floor(diffMs / (1000 * 60));
                return diffMins <= 1 ? 'Ahora' : `Hace ${diffMins} min`;
            }
            return `Hace ${diffHours}h`;
        }
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
        if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
        return `Hace ${Math.floor(diffDays / 365)} años`;
    }

    /**
     * Get last N days as date strings
     */
    lastNDays(n) {
        const result = [];
        const today = this.today();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            result.push(d.toDateString());
        }
        return result;
    }

    // ===== SIMULATION =====

    /**
     * Fast-forward time by N days (for testing/simulation)
     */
    fastForward(days) {
        this._offset += days * 24 * 60 * 60 * 1000;
    }

    /**
     * Reset simulation offset
     */
    resetSimulation() {
        this._offset = 0;
    }

    /**
     * Set a specific simulation date
     */
    simulateDate(date) {
        const target = new Date(date);
        this._offset = target.getTime() - Date.now();
    }
}

// Singleton export
export const time = new TimeEngine();
