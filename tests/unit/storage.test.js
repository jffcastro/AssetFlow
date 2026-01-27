// Storage Module Tests

import {
    loadPortfolioData,
    savePortfolioData,
    loadExchangeRateFromStorage,
    saveExchangeRateToStorage,
    loadHistoricalRatesFromStorage,
    saveHistoricalRatesToStorage,
    loadPriceCacheFromStorage,
    savePriceCacheToStorage,
    loadTransactions,
    saveTransactions,
    addTransaction,
    getCachedCryptoRates,
    setCachedCryptoRates
} from '../../js/modules/storage.js';

describe('Portfolio Data Storage', () => {
    test('loads portfolio data from localStorage', () => {
        const mockData = { stocks: [{ name: 'AAPL' }] };
        localStorage.setItem('portfolioPilotData', JSON.stringify(mockData));

        const result = loadPortfolioData();

        expect(result).toEqual(mockData);
        expect(result.stocks[0].name).toBe('AAPL');
    });

    test('returns null when no data exists', () => {
        localStorage.removeItem('portfolioPilotData');

        const result = loadPortfolioData();

        expect(result).toBeNull();
    });

    test('handles corrupted data gracefully', () => {
        localStorage.setItem('portfolioPilotData', 'invalid json');

        const result = loadPortfolioData();

        expect(result).toBeNull();
    });

    test('saves portfolio data to localStorage', () => {
        const data = { stocks: [{ name: 'GOOGL' }] };

        savePortfolioData(data);

        const stored = JSON.parse(localStorage.getItem('portfolioPilotData'));
        expect(stored).toEqual(data);
    });
});

describe('Exchange Rate Storage', () => {
    test('loads exchange rate from storage', () => {
        localStorage.setItem('eurUsdRate', '1.0850');

        const rate = loadExchangeRateFromStorage();

        expect(rate).toBe(1.085);
    });

    test('returns default rate when no data', () => {
        localStorage.removeItem('eurUsdRate');

        const rate = loadExchangeRateFromStorage();

        expect(rate).toBe(1.0);
    });

    test('returns default for invalid data', () => {
        localStorage.setItem('eurUsdRate', 'invalid');

        const rate = loadExchangeRateFromStorage();

        expect(rate).toBe(1.0);
    });

    test('saves exchange rate to storage', () => {
        saveExchangeRateToStorage(1.0923);

        expect(localStorage.getItem('eurUsdRate')).toBe('1.0923');
    });
});

describe('Historical Rates Storage', () => {
    test('loads historical rates from storage', () => {
        const mockRates = { '2024-01-01': 1.08, '2024-06-01': 1.10 };
        localStorage.setItem('historicalRates', JSON.stringify(mockRates));

        const result = loadHistoricalRatesFromStorage();

        expect(result['2024-01-01']).toBe(1.08);
        expect(result['2024-06-01']).toBe(1.10);
    });

    test('returns empty object when no data', () => {
        localStorage.removeItem('historicalRates');

        const result = loadHistoricalRatesFromStorage();

        expect(result).toEqual({});
    });

    test('saves historical rates to storage', () => {
        const rates = { '2024-01-01': 1.08 };

        saveHistoricalRatesToStorage(rates);

        const stored = JSON.parse(localStorage.getItem('historicalRates'));
        expect(stored).toEqual(rates);
    });
});

describe('Price Cache Storage', () => {
    test('loads price cache from storage', () => {
        const mockCache = {
            stocks: { 'AAPL': { price: 150 } },
            crypto: { 'bitcoin': { price: 50000 } }
        };
        localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(mockCache));

        const result = loadPriceCacheFromStorage();

        expect(result.stocks['AAPL'].price).toBe(150);
        expect(result.crypto['bitcoin'].price).toBe(50000);
    });

    test('returns structured empty cache', () => {
        localStorage.removeItem('portfolioPilotPriceCache');

        const result = loadPriceCacheFromStorage();

        expect(result).toEqual({ stocks: {}, crypto: {}, etfs: {} });
    });

    test('saves price cache to storage', () => {
        const cache = {
            stocks: { 'AAPL': { price: 175 } },
            crypto: {},
            etfs: {}
        };

        savePriceCacheToStorage(cache);

        const stored = JSON.parse(localStorage.getItem('portfolioPilotPriceCache'));
        expect(stored.stocks['AAPL'].price).toBe(175);
    });
});

describe('Transactions Storage', () => {
    test('loads transactions from storage', () => {
        const mockTransactions = [
            { id: '1', type: 'buy', symbol: 'AAPL' },
            { id: '2', type: 'sell', symbol: 'AAPL' }
        ];
        localStorage.setItem('portfolioPilotTransactions', JSON.stringify(mockTransactions));

        const result = loadTransactions();

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
    });

    test('returns empty array when no transactions', () => {
        localStorage.removeItem('portfolioPilotTransactions');

        const result = loadTransactions();

        expect(result).toEqual([]);
    });

    test('saves transactions to storage', () => {
        const transactions = [
            { id: '3', type: 'buy', symbol: 'GOOGL' }
        ];

        saveTransactions(transactions);

        const stored = JSON.parse(localStorage.getItem('portfolioPilotTransactions'));
        expect(stored).toHaveLength(1);
        expect(stored[0].symbol).toBe('GOOGL');
    });

    test('adds transaction to existing list', () => {
        localStorage.setItem('portfolioPilotTransactions', JSON.stringify([{ id: '1' }]));

        addTransaction({ id: '2', type: 'buy' });

        const stored = JSON.parse(localStorage.getItem('portfolioPilotTransactions'));
        expect(stored).toHaveLength(2);
        expect(stored[1].id).toBe('2');
    });
});

describe('Crypto Rates Cache', () => {
    test('gets cached crypto rates when valid', () => {
        const cachedData = {
            btc: 45000,
            eth: 2500,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotCryptoRates', JSON.stringify(cachedData));

        const result = getCachedCryptoRates();

        expect(result).toBeDefined();
        expect(result.btc).toBe(45000);
        expect(result.eth).toBe(2500);
    });

    test('returns null when cache expired', () => {
        const cachedData = {
            btc: 45000,
            eth: 2500,
            timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
        };
        localStorage.setItem('portfolioPilotCryptoRates', JSON.stringify(cachedData));

        const result = getCachedCryptoRates();

        expect(result).toBeNull();
    });

    test('sets crypto rates cache', () => {
        setCachedCryptoRates(50000, 3000);

        const stored = JSON.parse(localStorage.getItem('portfolioPilotCryptoRates'));
        expect(stored.btc).toBe(50000);
        expect(stored.eth).toBe(3000);
        expect(stored.timestamp).toBeDefined();
    });
});
