// State Module Tests

import {
    portfolio,
    priceCache,
    eurUsdRate,
    historicalRates,
    soldAssetsCache,
    setPortfolio,
    setPriceCache,
    setEurUsdRate,
    setHistoricalRates,
    setSoldAssetsCache,
    getPortfolio,
    getPriceCache,
    getEurUsdRate,
    getHistoricalRates,
    getSoldAssetsCache
} from '../../js/modules/state.js';

describe('State Module', () => {
    beforeEach(() => {
        // Reset state to initial values
        setPortfolio({
            stocks: [],
            etfs: [],
            crypto: [],
            static: [],
            cs2: null
        });
        setPriceCache({ stocks: {}, crypto: {}, etfs: {} });
        setEurUsdRate(1.0);
        setHistoricalRates({});
        setSoldAssetsCache({});
    });

    describe('Initial State', () => {
        test('portfolio has correct initial structure', () => {
            const p = getPortfolio();
            expect(p.stocks).toEqual([]);
            expect(p.etfs).toEqual([]);
            expect(p.crypto).toEqual([]);
            expect(p.static).toEqual([]);
            expect(p.cs2).toBeNull();
        });

        test('priceCache has correct initial structure', () => {
            const cache = getPriceCache();
            expect(cache.stocks).toEqual({});
            expect(cache.crypto).toEqual({});
            expect(cache.etfs).toEqual({});
        });

        test('eurUsdRate starts at 1.0', () => {
            expect(getEurUsdRate()).toBe(1.0);
        });

        test('historicalRates starts empty', () => {
            expect(getHistoricalRates()).toEqual({});
        });

        test('soldAssetsCache starts empty', () => {
            expect(getSoldAssetsCache()).toEqual({});
        });
    });

    describe('Setters', () => {
        test('setPortfolio updates portfolio state', () => {
            const newPortfolio = {
                stocks: [{ name: 'AAPL', quantity: 10 }],
                etfs: [],
                crypto: [],
                static: [],
                cs2: null
            };

            setPortfolio(newPortfolio);

            const result = getPortfolio();
            expect(result.stocks).toHaveLength(1);
            expect(result.stocks[0].name).toBe('AAPL');
        });

        test('setPriceCache updates price cache', () => {
            const newCache = {
                stocks: { 'AAPL': { price: 150 } },
                crypto: {},
                etfs: {}
            };

            setPriceCache(newCache);

            const result = getPriceCache();
            expect(result.stocks['AAPL'].price).toBe(150);
        });

        test('setEurUsdRate updates exchange rate', () => {
            setEurUsdRate(1.0925);

            expect(getEurUsdRate()).toBe(1.0925);
        });

        test('setHistoricalRates updates historical rates', () => {
            const rates = { '2024-01-01': 1.08, '2024-06-01': 1.10 };

            setHistoricalRates(rates);

            const result = getHistoricalRates();
            expect(result['2024-01-01']).toBe(1.08);
            expect(result['2024-06-01']).toBe(1.10);
        });

        test('setSoldAssetsCache updates cache', () => {
            const cache = { 'stocks_AAPL': { price: 155 } };

            setSoldAssetsCache(cache);

            const result = getSoldAssetsCache();
            expect(result['stocks_AAPL'].price).toBe(155);
        });
    });

    describe('Getters', () => {
        test('getPortfolio returns current portfolio', () => {
            const p = getPortfolio();
            expect(p).toBe(portfolio);
        });

        test('getPriceCache returns current price cache', () => {
            const cache = getPriceCache();
            expect(cache).toBe(priceCache);
        });

        test('getEurUsdRate returns current rate', () => {
            const rate = getEurUsdRate();
            expect(rate).toBe(eurUsdRate);
        });

        test('getHistoricalRates returns current rates', () => {
            const rates = getHistoricalRates();
            expect(rates).toBe(historicalRates);
        });

        test('getSoldAssetsCache returns current cache', () => {
            const cache = getSoldAssetsCache();
            expect(cache).toBe(soldAssetsCache);
        });
    });

    describe('State Mutations', () => {
        test('portfolio reference is preserved', () => {
            const original = getPortfolio();
            setPortfolio({ ...original, stocks: [{ name: 'TEST' }] });
            const updated = getPortfolio();

            expect(updated).toBe(portfolio);
        });

        test('priceCache reference is preserved', () => {
            const original = getPriceCache();
            setPriceCache({ ...original, stocks: { 'AAPL': { price: 100 } } });
            const updated = getPriceCache();

            expect(updated).toBe(priceCache);
        });
    });
});
