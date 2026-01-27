// Calculator Module Tests

import {
    calculateRealizedPnL,
    calculateTotalValue,
    getTransactionTotals,
    calculateHoldingTime
} from '../../js/modules/calculator.js';

describe('getTransactionTotals', () => {
    test('calculates totals by asset type', () => {
        const transactions = [
            { assetType: 'stocks', type: 'deposit', amount: 1000 },
            { assetType: 'stocks', type: 'withdrawal', amount: 200 },
            { assetType: 'crypto', type: 'deposit', amount: 500 },
            { assetType: 'etfs', type: 'deposit', amount: 300 }
        ];

        const totals = getTransactionTotals(transactions);

        expect(totals.stocks.deposit).toBe(1000);
        expect(totals.stocks.withdrawal).toBe(200);
        expect(totals.crypto.deposit).toBe(500);
        expect(totals.etfs.deposit).toBe(300);
    });

    test('returns zero for empty transactions', () => {
        const totals = getTransactionTotals([]);
        expect(totals.stocks.deposit).toBe(0);
        expect(totals.crypto.deposit).toBe(0);
    });
});

describe('calculateHoldingTime', () => {
    test('calculates holding time correctly', () => {
        const transactions = [
            { assetType: 'stocks', symbol: 'AAPL', type: 'buy', date: '2024-01-01' },
            { assetType: 'stocks', symbol: 'AAPL', type: 'sell', date: '2024-06-01' }
        ];

        const result = calculateHoldingTime(transactions, 'stocks', 'AAPL');

        expect(result).toBeDefined();
        expect(result.totalDays).toBeGreaterThan(700); // More than 2 years
        expect(result.years).toBeGreaterThanOrEqual(1);
    });

    test('returns null for no buy transactions', () => {
        const transactions = [
            { assetType: 'stocks', symbol: 'AAPL', type: 'sell', date: '2024-06-01' }
        ];

        const result = calculateHoldingTime(transactions, 'stocks', 'AAPL');
        expect(result).toBeNull();
    });

    test('returns null for non-existent asset', () => {
        const transactions = [
            { assetType: 'stocks', symbol: 'AAPL', type: 'buy', date: '2024-01-01' }
        ];

        const result = calculateHoldingTime(transactions, 'stocks', 'GOOGL');
        expect(result).toBeNull();
    });
});

describe('calculateRealizedPnL', () => {
    test('calculates realized P&L for completed sells', () => {
        const transactions = [
            { assetType: 'stocks', symbol: 'AAPL', type: 'buy', quantity: 10, price: 150, total: 1500, date: '2024-01-01', originalCurrency: 'USD', historicalRate: 1.1 },
            { assetType: 'stocks', symbol: 'AAPL', type: 'sell', quantity: 10, price: 180, total: 1800, date: '2024-06-01', originalCurrency: 'USD', historicalRate: 1.08 }
        ];

        const portfolio = { cs2: { portfolios: {} } };
        const result = calculateRealizedPnL(transactions, portfolio, 1.1);

        expect(result.stocks).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(0);
    });

    test('handles partial sells correctly', () => {
        const transactions = [
            { assetType: 'stocks', symbol: 'AAPL', type: 'buy', quantity: 100, price: 100, total: 10000, date: '2024-01-01', originalCurrency: 'USD', historicalRate: 1.1 },
            { assetType: 'stocks', symbol: 'AAPL', type: 'sell', quantity: 50, price: 150, total: 7500, date: '2024-03-01', originalCurrency: 'USD', historicalRate: 1.1 }
        ];

        const portfolio = { cs2: { portfolios: {} } };
        const result = calculateRealizedPnL(transactions, portfolio, 1.1);

        expect(result.stocks).toBeGreaterThan(0);
    });

    test('handles CS2 portfolios P&L', () => {
        const transactions = [];
        const portfolio = {
            cs2: {
                portfolios: {
                    'playItems': { value: 1000, realizedPnl: 200, currency: 'USD' }
                }
            }
        };

        const result = calculateRealizedPnL(transactions, portfolio, 1.1);

        expect(result.cs2).toBeGreaterThan(0);
    });

    test('returns zeros for no transactions', () => {
        const portfolio = { cs2: { portfolios: {} } };
        const result = calculateRealizedPnL([], portfolio, 1.1);

        expect(result.stocks).toBe(0);
        expect(result.etfs).toBe(0);
        expect(result.crypto).toBe(0);
        expect(result.cs2).toBe(0);
        expect(result.total).toBe(0);
    });
});

describe('calculateTotalValue', () => {
    test('calculates total portfolio value', () => {
        const portfolio = {
            stocks: [{ name: 'AAPL', quantity: 10 }],
            etfs: [],
            crypto: [],
            static: [],
            cs2: { value: 500, currency: 'EUR' }
        };

        const priceCache = {
            stocks: { 'AAPL': { price: 150 } }
        };

        const result = calculateTotalValue(portfolio, priceCache, 1.1);

        expect(result).toBeGreaterThan(0);
    });

    test('handles empty portfolio', () => {
        const portfolio = {
            stocks: [],
            etfs: [],
            crypto: [],
            static: [],
            cs2: null
        };

        const priceCache = { stocks: {}, crypto: {}, etfs: {} };
        const result = calculateTotalValue(portfolio, priceCache, 1.1);

        expect(result).toBe(0);
    });

    test('calculates CS2 value in EUR', () => {
        const portfolio = {
            stocks: [],
            etfs: [],
            crypto: [],
            static: [],
            cs2: {
                portfolios: {
                    'test': { value: 1000, currency: 'USD' }
                }
            }
        };

        const priceCache = {};
        const result = calculateTotalValue(portfolio, priceCache, 1.1);

        // Should convert USD to EUR
        expect(result).toBeCloseTo(1000 / 1.1, 0);
    });
});
