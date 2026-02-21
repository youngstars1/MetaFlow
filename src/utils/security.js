/**
 * Financial Utility for Precise Calculations
 * Prevents floating point errors by using integer math (cents/base units)
 * where necessary or rounding to 2 decimals strictly.
 */

export const Finance = {
    /**
     * Adds two numbers safely
     */
    add: (a, b) => {
        return Math.round((Number(a) + Number(b)) * 100) / 100;
    },

    /**
     * Subtracts b from a safely
     */
    subtract: (a, b) => {
        return Math.round((Number(a) - Number(b)) * 100) / 100;
    },

    /**
     * Multiplies safely
     */
    multiply: (a, b) => {
        return Math.round((Number(a) * Number(b)) * 100) / 100;
    },

    /**
     * Formats for internal storage (integer units if needed, but here we stay with 2 decimals)
     */
    parse: (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }
};

/**
 * Data Sanitization Utility
 * Simple XSS prevention for user-generated strings
 */
export const Sanitize = {
    html: (str) => {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
