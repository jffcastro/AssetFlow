// Integration Tests - Full Workflow Tests

import {
    calculateRealizedPnL,
    calculateTotalValue
} from '../../js/modules/calculator.js';

import {
    loadPortfolioData,
    savePortfolioData,
    loadTransactions,
    saveTransactions
} from '../../js/modules/storage.js';

import {
    setPortfolio,
    getPortfolio,
    setEurUsdRate
} from '../../js/modules/state.js';

describe('Full Portfolio Workflow', () => {
    beforeEach(() => {
        localStorage.clear();
        setPortfolio({
            stocks: [],
            etfs: [],
            crypto: [],
            static: [],
            cs2: null
        });
        setEurUsdRate(1.1);
    });

    test('buy and sell stocks workflow', () => {
        // Add stock to portfolio
        const portfolio = getPortfolio();
        portfolio.stocks = [{ name: 'AAPL', quantity: 10, price: 150, currency: 'USD' }];
        setPortfolio(portfolio);

        // Save and reload
        savePortfolioData(getPortfolio());
        const loaded = loadPortfolioData();
        
        expect(loaded.stocks).toHaveLength(1);
        expect(loaded.stocks[0].name).toBe('AAPL');
    });

    test('calculate P&L after complete sell', () => {
        const transactions = [
            { 
                assetType: 'stocks', 
                symbol: 'AAPL', 
                type: 'buy', 
                quantity: 10, 
                price: 150, 
                total: 1500,
                originalCurrency: 'USD',
                historicalRate: 1.1,
                date: '2024-01-01'
            },
            { 
                assetType: 'stocks', 
                symbol: 'AAPL', 
                type: 'sell', 
                quantity: 10, 
                price: 180, 
                total: 1800,
                originalCurrency: 'USD',
                historicalRate: 1.08,
                date: '2024-06-01'
            }
        ];

        saveTransactions(transactions);

        const loadedTransactions = loadTransactions();
        const result = calculateRealizedPnL(loadedTransactions, getPortfolio(), 1.1);

        expect(result.stocks).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(0);
    });

    test('calculate total portfolio value with multiple assets', () => {
        const portfolio = getPortfolio();
        portfolio.stocks = [{ name: 'AAPL', quantity: 10 }];
        portfolio.crypto = [{ name: 'bitcoin', quantity: 0.5, currency: 'USD' }];
        portfolio.cs2 = { value: 1000, currency: 'EUR', portfolios: {} };
        setPortfolio(portfolio);

        const priceCache = {
            stocks: { 'AAPL': { price: 150 } },
            crypto: { 'bitcoin': { price: 50000 } },
            etfs: {}
        };

        const totalValue = calculateTotalValue(getPortfolio(), priceCache, 1.1);

        // Should include: stocks (1500) + crypto (25000/1.1 = 22727 EUR) + CS2 (1000 EUR)
        expect(totalValue).toBeGreaterThan(24000);
    });

    test('handles CS2 portfolio with multiple sub-portfolios', () => {
        const portfolio = getPortfolio();
        portfolio.cs2 = {
            value: 0,
            currency: 'EUR',
            portfolios: {
                'playItems': { name: 'Play Items', value: 500, realizedPnl: 100, currency: 'USD' },
                'investItems': { name: 'Invest Items', value: 1500, realizedPnl: 200, currency: 'USD' }
            }
        };
        setPortfolio(portfolio);

        const transactions = [];
        const result = calculateRealizedPnL(transactions, getPortfolio(), 1.1);

        // CS2 realized P&L should include both portfolios (converted to EUR)
        expect(result.cs2).toBeGreaterThan(0);
    });

    test('persists data across storage operations', () => {
        const portfolio = getPortfolio();
        portfolio.stocks = [{ name: 'MSFT', quantity: 5, price: 350 }];
        setPortfolio(portfolio);

        // Save
        savePortfolioData(getPortfolio());

        // Modify current state
        const current = getPortfolio();
        current.stocks[0].quantity = 10;
        setPortfolio(current);

        // Reload from storage
        const loaded = loadPortfolioData();
        
        // Loaded data should have original quantity
        expect(loaded.stocks[0].quantity).toBe(5);
        
        // Current state should have updated quantity
        expect(getPortfolio().stocks[0].quantity).toBe(10);
    });
});
