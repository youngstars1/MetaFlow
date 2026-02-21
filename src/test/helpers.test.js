import { describe, it, expect } from 'vitest';
import {
    generateId,
    formatCurrency,
    formatDate,
    formatDateShort,
    daysRemaining,
    getProgressPercentage,
    calculateSavingsRecommendation,
    getMotivationalQuote,
    getTransactionCategories,
    getPriorityLabel,
} from '../utils/helpers';

describe('generateId', () => {
    it('should generate a unique string id', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
        expect(id1).not.toBe(id2);
    });
});

describe('formatCurrency', () => {
    it('should format numbers as Chilean pesos', () => {
        const result = formatCurrency(1000);
        expect(result).toContain('1.000');
        expect(result).toContain('$');
    });

    it('should handle zero', () => {
        const result = formatCurrency(0);
        expect(result).toContain('$');
        expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
        const result = formatCurrency(1500000);
        expect(result).toContain('1.500.000');
    });

    it('should handle negative numbers', () => {
        const result = formatCurrency(-5000);
        expect(result).toContain('5.000');
    });
});

describe('formatDate', () => {
    it('should format a valid date', () => {
        const result = formatDate('2025-06-15');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty/null input', () => {
        const result = formatDate(null);
        expect(result).toBe('');
    });

    it('should handle invalid date', () => {
        const result = formatDate('not-a-date');
        expect(result).toBe('');
    });
});

describe('formatDateShort', () => {
    it('should format a short date', () => {
        const result = formatDateShort('2025-06-15');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});

describe('daysRemaining', () => {
    it('should return positive days for future dates', () => {
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const days = daysRemaining(future.toISOString());
        expect(days).toBeGreaterThanOrEqual(29);
        expect(days).toBeLessThanOrEqual(31);
    });

    it('should return 0 for past dates', () => {
        const past = new Date('2020-01-01');
        const days = daysRemaining(past.toISOString());
        expect(days).toBe(0);
    });

    it('should return 0 for null', () => {
        const days = daysRemaining(null);
        expect(days).toBe(0);
    });
});

describe('getProgressPercentage', () => {
    it('should calculate correct percentage', () => {
        expect(getProgressPercentage(50, 100)).toBe(50);
        expect(getProgressPercentage(100, 100)).toBe(100);
        expect(getProgressPercentage(0, 100)).toBe(0);
    });

    it('should cap at 100', () => {
        expect(getProgressPercentage(150, 100)).toBe(100);
    });

    it('should handle zero target', () => {
        expect(getProgressPercentage(50, 0)).toBe(0);
    });
});

describe('calculateSavingsRecommendation', () => {
    it('should return daily, weekly, monthly recommendations', () => {
        const future = new Date();
        future.setDate(future.getDate() + 90);
        const rec = calculateSavingsRecommendation(90000, future.toISOString());

        expect(rec).toHaveProperty('daily');
        expect(rec).toHaveProperty('weekly');
        expect(rec).toHaveProperty('monthly');
        expect(rec.daily).toBeGreaterThan(0);
        expect(rec.weekly).toBeGreaterThan(rec.daily);
        expect(rec.monthly).toBeGreaterThan(rec.weekly);
    });

    it('should handle zero remaining', () => {
        const rec = calculateSavingsRecommendation(0, '2030-01-01');
        expect(rec.daily).toBe(0);
        expect(rec.weekly).toBe(0);
        expect(rec.monthly).toBe(0);
    });
});

describe('getMotivationalQuote', () => {
    it('should return a string', () => {
        const quote = getMotivationalQuote(50);
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
    });

    it('should return different quotes for different progress levels', () => {
        const low = getMotivationalQuote(10);
        const high = getMotivationalQuote(90);
        expect(typeof low).toBe('string');
        expect(typeof high).toBe('string');
    });

    it('should handle 100% progress', () => {
        const quote = getMotivationalQuote(100);
        expect(typeof quote).toBe('string');
        expect(quote.length).toBeGreaterThan(0);
    });
});

describe('getTransactionCategories', () => {
    it('should return categories for ingreso', () => {
        const cats = getTransactionCategories('ingreso');
        expect(Array.isArray(cats)).toBe(true);
        expect(cats.length).toBeGreaterThan(0);
        cats.forEach(cat => {
            expect(cat).toHaveProperty('value');
            expect(cat).toHaveProperty('label');
        });
    });

    it('should return categories for gasto', () => {
        const cats = getTransactionCategories('gasto');
        expect(cats.length).toBeGreaterThan(0);
    });

    it('should return categories for ahorro', () => {
        const cats = getTransactionCategories('ahorro');
        expect(cats.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown type', () => {
        const cats = getTransactionCategories('unknown');
        expect(Array.isArray(cats)).toBe(true);
        expect(cats.length).toBe(0);
    });
});

describe('getPriorityLabel', () => {
    it('should return correct labels', () => {
        expect(getPriorityLabel('alta')).toContain('Alta');
        expect(getPriorityLabel('media')).toContain('Media');
        expect(getPriorityLabel('baja')).toContain('Baja');
    });

    it('should handle unknown priority', () => {
        const label = getPriorityLabel('unknown');
        expect(typeof label).toBe('string');
    });
});
