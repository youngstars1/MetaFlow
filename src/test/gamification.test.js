import { describe, it, expect } from 'vitest';
import {
    calculateLevel,
    getXPForNextLevel,
    getLevelTitle,
    getLevelIcon,
    evaluateBadges,
    countEarnedBadges,
    XP_REWARDS,
    BADGES,
} from '../utils/gamification';

describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
        expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 2 for 200 XP', () => {
        expect(calculateLevel(200)).toBe(2);
    });

    it('should return level 3 for 500 XP', () => {
        expect(calculateLevel(500)).toBe(3);
    });

    it('should not exceed max level', () => {
        const level = calculateLevel(999999);
        expect(level).toBeLessThanOrEqual(18);
    });

    it('should increase with more XP', () => {
        const level1 = calculateLevel(50);
        const level2 = calculateLevel(1000);
        expect(level2).toBeGreaterThan(level1);
    });
});

describe('getXPForNextLevel', () => {
    it('should return progress info', () => {
        const xpInfo = getXPForNextLevel(50);
        expect(xpInfo).toHaveProperty('current');
        expect(xpInfo).toHaveProperty('needed');
        expect(xpInfo).toHaveProperty('progress');
        expect(xpInfo.progress).toBeGreaterThanOrEqual(0);
        expect(xpInfo.progress).toBeLessThanOrEqual(100);
    });

    it('should show 0 progress at level threshold', () => {
        const xpInfo = getXPForNextLevel(200); // Exactly level 2
        expect(xpInfo.current).toBe(0);
    });

    it('should show 100% at max level', () => {
        const xpInfo = getXPForNextLevel(999999);
        expect(xpInfo.progress).toBe(100);
    });
});

describe('getLevelTitle', () => {
    it('should return a string title for any level', () => {
        for (let i = 1; i <= 18; i++) {
            const title = getLevelTitle(i);
            expect(typeof title).toBe('string');
            expect(title.length).toBeGreaterThan(0);
        }
    });

    it('should return "Iniciado" for level 1', () => {
        expect(getLevelTitle(1)).toBe('Iniciado');
    });
});

describe('getLevelIcon', () => {
    it('should return an emoji for any level', () => {
        for (let i = 1; i <= 18; i++) {
            const icon = getLevelIcon(i);
            expect(typeof icon).toBe('string');
            expect(icon.length).toBeGreaterThan(0);
        }
    });
});

describe('XP_REWARDS', () => {
    it('should have positive values for all rewards', () => {
        Object.values(XP_REWARDS).forEach(value => {
            expect(value).toBeGreaterThan(0);
        });
    });

    it('should give more XP for harder achievements', () => {
        expect(XP_REWARDS.GOAL_COMPLETED).toBeGreaterThan(XP_REWARDS.GOAL_CREATED);
        expect(XP_REWARDS.ROUTINE_STREAK_30).toBeGreaterThan(XP_REWARDS.ROUTINE_STREAK_7);
        expect(XP_REWARDS.ALL_ROUTINES_TODAY).toBeGreaterThan(XP_REWARDS.ROUTINE_COMPLETE);
    });

    it('should have streak progression', () => {
        expect(XP_REWARDS.ROUTINE_STREAK_60).toBeGreaterThan(XP_REWARDS.ROUTINE_STREAK_30);
        expect(XP_REWARDS.ROUTINE_STREAK_100).toBeGreaterThan(XP_REWARDS.ROUTINE_STREAK_60);
    });
});

describe('BADGES', () => {
    it('should have unique IDs', () => {
        const ids = BADGES.map(b => b.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields', () => {
        BADGES.forEach(badge => {
            expect(badge).toHaveProperty('id');
            expect(badge).toHaveProperty('name');
            expect(badge).toHaveProperty('description');
            expect(badge).toHaveProperty('icon');
            expect(badge).toHaveProperty('category');
            expect(typeof badge.condition).toBe('function');
        });
    });

    it('should have at least 10 badges', () => {
        expect(BADGES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have 3 categories', () => {
        const categories = new Set(BADGES.map(b => b.category));
        expect(categories.size).toBeGreaterThanOrEqual(3);
    });
});

describe('evaluateBadges', () => {
    it('should return badges with earned status', () => {
        const state = {
            goals: [],
            transactions: [],
            routines: [],
            gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
        };
        const badges = evaluateBadges(state);
        expect(badges.length).toBe(BADGES.length);
        badges.forEach(badge => {
            expect(badge).toHaveProperty('earned');
            expect(typeof badge.earned).toBe('boolean');
        });
    });

    it('should earn first_step badge when a goal exists', () => {
        const state = {
            goals: [{ id: '1', name: 'Test', targetAmount: 100, currentAmount: 0 }],
            transactions: [],
            routines: [],
            gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
        };
        const badges = evaluateBadges(state);
        const firstStep = badges.find(b => b.id === 'first_step');
        expect(firstStep.earned).toBe(true);
    });

    it('should not earn badges with empty state', () => {
        const state = {
            goals: [],
            transactions: [],
            routines: [],
            gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
        };
        const earned = countEarnedBadges(state);
        expect(earned).toBe(0);
    });

    it('should earn saver_100k when goal has 100k saved', () => {
        const state = {
            goals: [{ id: '1', name: 'Test', targetAmount: 200000, currentAmount: 150000 }],
            transactions: [],
            routines: [],
            gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
        };
        const badges = evaluateBadges(state);
        const saver = badges.find(b => b.id === 'saver_100k');
        expect(saver.earned).toBe(true);
    });

    it('should earn discipline_iron with 7-day streak', () => {
        const state = {
            goals: [],
            transactions: [],
            routines: [{ id: '1', name: 'Test', streak: 7, completedDates: [] }],
            gamification: { totalXP: 0, xpLog: [], earnedBadgeIds: [] },
        };
        const badges = evaluateBadges(state);
        const disc = badges.find(b => b.id === 'discipline_iron');
        expect(disc.earned).toBe(true);
    });
});
