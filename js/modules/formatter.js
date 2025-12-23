// Formatter Module
// Functions for formatting currency and quantities

/**
 * Formats a value as currency with dynamic precision.
 * Values < 1.0 show up to 8 decimal places.
 * Values >= 1.0 show 2 decimal places.
 * @param {number} value - The numeric value to format
 * @param {string} currency - 'EUR' or 'USD'
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'EUR') {
    // Handle undefined, null, or invalid values
    if (value === undefined || value === null || isNaN(value)) {
        value = 0;
    }

    // Dynamic precision: 8 decimals for values < 1, 2 decimals for others
    const isSmallValue = Math.abs(value) < 1.0 && Math.abs(value) > 0;
    const maxDigits = isSmallValue ? 8 : 2;

    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: maxDigits
    })}`;
}

/**
 * Formats a quantity value with dynamic precision.
 * Values < 1.0 show up to 8 decimal places.
 * Values >= 1.0 show max 2 decimal places.
 * Integers show no decimal places.
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted quantity string
 */
export function formatQuantity(value) {
    if (value === undefined || value === null || isNaN(value)) {
        return '0';
    }

    // Dynamic precision: 8 decimals for values < 1, 2 decimals for others
    const isSmallValue = Math.abs(value) < 1.0 && Math.abs(value) > 0;
    const maxDigits = isSmallValue ? 8 : 2;

    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDigits
    });
}
