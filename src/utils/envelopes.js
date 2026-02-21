// ==================================================
// VIRTUAL ENVELOPES — Smart Income Distribution
// ==================================================

import { storage } from './storage';

const ENVELOPES_KEY = 'metaflow_envelopes';

/**
 * Get envelope configuration
 */
export function getEnvelopes() {
    const data = storage.get(ENVELOPES_KEY);
    return data || {
        enabled: false,
        rules: [],
        // rules: [{ id, name, percentage, goalId?, type: 'meta'|'gasto'|'ahorro' }]
    };
}

/**
 * Save envelope configuration
 */
export function saveEnvelopes(envelopes) {
    storage.set(ENVELOPES_KEY, envelopes);
}

/**
 * Calculate distribution for a given income amount
 * @param {number} amount — Income amount to distribute
 * @param {array} rules — Envelope rules from config
 * @returns {array} Distribution breakdown
 */
export function calculateDistribution(amount, rules) {
    if (!rules || rules.length === 0) return [];

    const totalPercentage = rules.reduce((sum, r) => sum + r.percentage, 0);
    const remaining = Math.max(0, 100 - totalPercentage);

    const distribution = rules.map(rule => ({
        ...rule,
        suggestedAmount: Math.round((amount * rule.percentage) / 100),
    }));

    if (remaining > 0) {
        distribution.push({
            id: '_libre',
            name: 'Libre / Sin asignar',
            percentage: remaining,
            type: 'libre',
            suggestedAmount: Math.round((amount * remaining) / 100),
        });
    }

    return distribution;
}

/**
 * Get default envelope templates
 */
export function getEnvelopeTemplates() {
    return [
        {
            name: '50/30/20 (Clásico)',
            description: 'La regla más popular: 50% gastos, 30% deseos, 20% ahorro',
            rules: [
                { id: 'needs', name: 'Gastos Esenciales', percentage: 50, type: 'gasto' },
                { id: 'wants', name: 'Deseos / Personal', percentage: 30, type: 'gasto' },
                { id: 'savings', name: 'Ahorro / Inversión', percentage: 20, type: 'ahorro' },
            ],
        },
        {
            name: '60/20/20 (Emprendedor)',
            description: 'Para quienes reinvierten en su negocio',
            rules: [
                { id: 'business', name: 'Negocio / Operación', percentage: 60, type: 'gasto' },
                { id: 'savings', name: 'Ahorro para Metas', percentage: 20, type: 'ahorro' },
                { id: 'personal', name: 'Gastos Personales', percentage: 20, type: 'gasto' },
            ],
        },
        {
            name: '70/20/10 (Agresivo)',
            description: 'Prioriza el ahorro y la inversión agresivamente',
            rules: [
                { id: 'savings', name: 'Ahorro / Inversión', percentage: 70, type: 'ahorro' },
                { id: 'needs', name: 'Gastos Necesarios', percentage: 20, type: 'gasto' },
                { id: 'fun', name: 'Entretenimiento', percentage: 10, type: 'gasto' },
            ],
        },
        {
            name: 'Meta-First (Custom)',
            description: 'Asigna primero a tus metas, después el resto',
            rules: [
                { id: 'meta1', name: 'Meta Principal', percentage: 30, type: 'meta' },
                { id: 'meta2', name: 'Meta Secundaria', percentage: 15, type: 'meta' },
                { id: 'emergency', name: 'Fondo Emergencia', percentage: 10, type: 'ahorro' },
                { id: 'living', name: 'Gastos de Vida', percentage: 45, type: 'gasto' },
            ],
        },
    ];
}
