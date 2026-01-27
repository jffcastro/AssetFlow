// Formatter Module Tests

import { formatCurrency, formatQuantity } from '../../js/modules/formatter.js';

describe('formatCurrency', () => {
    test('formats EUR correctly', () => {
        expect(formatCurrency(100, 'EUR')).toBe('€100.00');
    });

    test('formats USD correctly', () => {
        expect(formatCurrency(100, 'USD')).toBe('$100.00');
    });

    test('handles small values with 8 decimal places', () => {
        const result = formatCurrency(0.00001234, 'EUR');
        expect(result).toContain('€');
        expect(result).toContain('0.00001234');
    });

    test('handles zero value', () => {
        expect(formatCurrency(0, 'EUR')).toBe('€0.00');
    });

    test('handles undefined value', () => {
        expect(formatCurrency(undefined, 'EUR')).toBe('€0.00');
    });

    test('handles null value', () => {
        expect(formatCurrency(null, 'EUR')).toBe('€0.00');
    });

    test('handles NaN value', () => {
        expect(formatCurrency(NaN, 'EUR')).toBe('€0.00');
    });

    test('handles large values with commas', () => {
        expect(formatCurrency(1000000, 'EUR')).toBe('€1,000,000.00');
    });

    test('handles negative values', () => {
        expect(formatCurrency(-100, 'EUR')).toBe('€-100.00');
    });

    test('handles decimal values', () => {
        expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
    });
});

describe('formatQuantity', () => {
    test('formats whole numbers without decimals', () => {
        expect(formatQuantity(100)).toBe('100');
    });

    test('formats small values with 8 decimal places', () => {
        const result = formatQuantity(0.00001234);
        expect(result).toContain('0.00001234');
    });

    test('handles zero', () => {
        expect(formatQuantity(0)).toBe('0');
    });

    test('handles undefined', () => {
        expect(formatQuantity(undefined)).toBe('0');
    });

    test('handles null', () => {
        expect(formatQuantity(null)).toBe('0');
    });

    test('handles NaN', () => {
        expect(formatQuantity(NaN)).toBe('0');
    });

    test('handles large numbers with commas', () => {
        expect(formatQuantity(1000000)).toBe('1,000,000');
    });

    test('handles fractional values', () => {
        expect(formatQuantity(0.5)).toMatch(/^0\.5/);
    });
});
