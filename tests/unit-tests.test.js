/**
 * AssetFlow Unit Tests
 * 
 * This file contains unit tests for the AssetFlow portfolio management application.
 * Tests are organized by functionality and can be run independently or as part of a test suite.
 */

describe('Data Management', () => {
  beforeEach(() => {
    // Reset portfolio state
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    priceCache = { stocks: {}, crypto: {} };
    eurUsdRate = 1.0;
  });

  test('should save and load portfolio data', () => {
    const testData = {
      stocks: [{ name: 'TEST', quantity: 10, purchasePrice: 100, currency: 'EUR' }],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    
    portfolio = testData;
    saveData();
    
    // Clear and reload
    portfolio = { stocks: [], etfs: [], crypto: [], static: [], cs2: { value: 0, currency: 'EUR' } };
    loadData();
    
    expect(portfolio.stocks.length).toBe(1);
    expect(portfolio.stocks[0].name).toBe('TEST');
  });

  test('should save and load price cache', () => {
    const testCache = {
      stocks: { 'TEST': { price: 100, timestamp: Date.now() } },
      crypto: { 'bitcoin': { price: 50000, timestamp: Date.now() } }
    };
    
    priceCache = testCache;
    savePriceCache();
    
    // Clear and reload
    priceCache = { stocks: {}, crypto: {} };
    loadPriceCache();
    
    expect(priceCache.stocks['TEST'].price).toBe(100);
    expect(priceCache.crypto['bitcoin'].price).toBe(50000);
  });

  test('should handle invalid JSON gracefully', () => {
    localStorage.setItem('portfolioPilotData', 'invalid-json');
    loadData();
    
    // Should not throw error and should have default structure
    expect(Array.isArray(portfolio.stocks)).toBeTruthy();
    expect(Array.isArray(portfolio.etfs)).toBeTruthy();
    expect(Array.isArray(portfolio.crypto)).toBeTruthy();
    expect(Array.isArray(portfolio.static)).toBeTruthy();
  });
});

describe('Portfolio Management', () => {
  beforeEach(() => {
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    priceCache = { stocks: {}, crypto: {} };
    eurUsdRate = 1.1;
  });

  test('should add stock to portfolio', () => {
    const originalLength = portfolio.stocks.length;
    portfolio.stocks.push({
      id: Date.now(),
      name: 'AAPL',
      quantity: 10,
      purchasePrice: 150,
      currency: 'USD'
    });
    
    expect(portfolio.stocks.length).toBe(originalLength + 1);
    expect(portfolio.stocks[0].name).toBe('AAPL');
  });

  test('should add ETF to portfolio', () => {
    const originalLength = portfolio.etfs.length;
    portfolio.etfs.push({
      id: Date.now(),
      name: 'SPY',
      quantity: 5,
      purchasePrice: 400,
      currency: 'USD'
    });
    
    expect(portfolio.etfs.length).toBe(originalLength + 1);
    expect(portfolio.etfs[0].name).toBe('SPY');
  });

  test('should add crypto to portfolio', () => {
    const originalLength = portfolio.crypto.length;
    portfolio.crypto.push({
      id: Date.now(),
      name: 'bitcoin',
      quantity: 0.1,
      purchasePrice: 50000,
      currency: 'USD'
    });
    
    expect(portfolio.crypto.length).toBe(originalLength + 1);
    expect(portfolio.crypto[0].name).toBe('bitcoin');
  });

  test('should add static asset to portfolio', () => {
    const originalLength = portfolio.static.length;
    portfolio.static.push({
      id: Date.now(),
      name: 'Emergency Fund',
      type: 'Emergency Fund',
      values: [{
        date: new Date().toISOString().slice(0, 10),
        value: 5000,
        currency: 'EUR'
      }]
    });
    
    expect(portfolio.static.length).toBe(originalLength + 1);
    expect(portfolio.static[0].name).toBe('Emergency Fund');
  });
});

describe('Transaction Management', () => {
  beforeEach(() => {
    // Clear transactions
    localStorage.removeItem('portfolioPilotTransactions');
  });

  test('should add transaction', () => {
    const originalTransactions = loadTransactions();
    const testTransaction = {
      id: Date.now().toString(),
      type: 'deposit',
      assetType: 'stocks',
      amount: 1000,
      date: new Date().toISOString().slice(0, 10),
      note: 'Test deposit'
    };
    
    addTransaction(testTransaction);
    const newTransactions = loadTransactions();
    
    expect(newTransactions.length).toBe(originalTransactions.length + 1);
    expect(newTransactions[newTransactions.length - 1].type).toBe('deposit');
  });

  test('should calculate transaction totals correctly', () => {
    const transactions = [
      { type: 'deposit', assetType: 'stocks', amount: 1000 },
      { type: 'withdrawal', assetType: 'stocks', amount: 200 },
      { type: 'deposit', assetType: 'crypto', amount: 500 },
      { type: 'deposit', assetType: 'etfs', amount: 300 }
    ];
    
    const totals = getTransactionTotals(transactions);
    
    expect(totals.stocks.deposit).toBe(1000);
    expect(totals.stocks.withdrawal).toBe(200);
    expect(totals.crypto.deposit).toBe(500);
    expect(totals.etfs.deposit).toBe(300);
  });

  test('should save and load transactions', () => {
    const testTransactions = [
      { id: '1', type: 'deposit', assetType: 'stocks', amount: 1000, date: '2024-01-01' },
      { id: '2', type: 'withdrawal', assetType: 'crypto', amount: 200, date: '2024-01-02' }
    ];
    
    saveTransactions(testTransactions);
    const loadedTransactions = loadTransactions();
    
    expect(loadedTransactions.length).toBe(2);
    expect(loadedTransactions[0].type).toBe('deposit');
    expect(loadedTransactions[1].type).toBe('withdrawal');
  });
});

describe('Validation History', () => {
  beforeEach(() => {
    localStorage.removeItem('portfolioPilotValidatedHistory');
  });

  test('should add entry to validated history', () => {
    const originalHistory = loadValidatedHistory();
    const testEntry = {
      date: '2024-01-01',
      total: 10000,
      eur: 10000,
      usd: 11000,
      stocks: 5000,
      etfs: 2000,
      crypto: 1000,
      static: 1500,
      cs2: 500
    };
    
    const newHistory = [...originalHistory, testEntry];
    saveValidatedHistory(newHistory);
    const loadedHistory = loadValidatedHistory();
    
    expect(loadedHistory.length).toBe(originalHistory.length + 1);
    expect(loadedHistory[loadedHistory.length - 1].total).toBe(10000);
  });

  test('should load empty history when none exists', () => {
    const history = loadValidatedHistory();
    expect(Array.isArray(history)).toBeTruthy();
    expect(history.length).toBe(0);
  });
});

describe('Utility Functions', () => {
  test('should format currency correctly', () => {
    const eurResult = formatCurrency(1234.56, 'EUR');
    const usdResult = formatCurrency(1234.56, 'USD');
    
    expect(eurResult).toContain('€');
    expect(usdResult).toContain('$');
    expect(eurResult).toContain('1,234.56');
    expect(usdResult).toContain('1,234.56');
  });

  test('should handle zero values in currency formatting', () => {
    const zeroResult = formatCurrency(0, 'EUR');
    expect(zeroResult).toContain('€0.00');
  });

  test('should handle negative values in currency formatting', () => {
    const negativeResult = formatCurrency(-1234.56, 'EUR');
    expect(negativeResult).toContain('€-1,234.56');
  });
});

describe('Portfolio Calculations', () => {
  beforeEach(() => {
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    priceCache = { stocks: {}, crypto: {} };
    eurUsdRate = 1.1;
  });

  test('should calculate total portfolio value', () => {
    // Set up test data
    portfolio.stocks = [{ name: 'TEST', quantity: 10, purchasePrice: 50, currency: 'EUR' }];
    portfolio.etfs = [{ name: 'TEST-ETF', quantity: 5, purchasePrice: 100, currency: 'EUR' }];
    portfolio.crypto = [{ name: 'bitcoin', quantity: 0.1, purchasePrice: 50000, currency: 'USD' }];
    portfolio.static = [{
      name: 'Test Savings',
      type: 'Savings',
      values: [{ date: new Date().toISOString().slice(0, 10), value: 1000, currency: 'EUR' }]
    }];
    portfolio.cs2 = { value: 500, currency: 'EUR' };
    
    // Set up price cache
    priceCache.stocks = { 'TEST': { price: 60 }, 'TEST-ETF': { price: 110 } };
    priceCache.crypto = { 'bitcoin': { price: 55000 } };
    
    const totalValue = calculateTotalValue();
    
    // Expected: (10*60) + (5*110) + (0.1*55000/1.1) + 1000 + 500 = 600 + 550 + 5000 + 1000 + 500 = 7650
    expect(Math.abs(totalValue - 7650)).toBeLessThan(0.01);
  });

  test('should handle zero values in calculations', () => {
    portfolio.stocks = [{ name: 'ZERO', quantity: 0, purchasePrice: 0, currency: 'EUR' }];
    priceCache.stocks = { 'ZERO': { price: 0 } };
    
    const totalValue = calculateTotalValue();
    expect(totalValue).toBe(0);
  });

  test('should handle missing price data', () => {
    portfolio.stocks = [{ name: 'NO_PRICE', quantity: 10, purchasePrice: 50, currency: 'EUR' }];
    priceCache.stocks = {}; // No price data
    
    const totalValue = calculateTotalValue();
    expect(totalValue).toBe(0);
  });

  test('should handle negative quantities', () => {
    portfolio.stocks = [{ name: 'NEGATIVE', quantity: -10, purchasePrice: 50, currency: 'EUR' }];
    priceCache.stocks = { 'NEGATIVE': { price: 60 } };
    
    const totalValue = calculateTotalValue();
    expect(totalValue).toBe(-600);
  });
});

describe('API Key Management', () => {
  beforeEach(() => {
    localStorage.removeItem('portfolioPilotFinnhub');
    localStorage.removeItem('portfolioPilotCoinMarketCal');
  });

  test('should save and load API key', () => {
    const testKey = 'test-api-key-123';
    const testConfig = {
      apiKey: testKey,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('portfolioPilotFinnhub', JSON.stringify(testConfig));
    const loadedKey = getApiKey('Finnhub');
    
    expect(loadedKey).toBe(testKey);
  });

  test('should return null for non-existent API key', () => {
    const loadedKey = getApiKey('NonExistent');
    expect(loadedKey).toBeFalsy();
  });

  test('should track API usage', () => {
    const today = new Date().toDateString();
    const originalUsage = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
    
    trackApiUsage('Finnhub');
    const newUsage = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
    
    expect(newUsage[today]).toBe((originalUsage[today] || 0) + 1);
  });
});

describe('Exchange Rate Management', () => {
  beforeEach(() => {
    eurUsdRate = 1.0;
    localStorage.removeItem('eurUsdRate');
  });

  test('should save and load exchange rate', () => {
    const testRate = 1.15;
    saveExchangeRate(testRate);
    
    // Clear and reload
    eurUsdRate = 1.0;
    loadExchangeRate();
    
    expect(Math.abs(eurUsdRate - testRate)).toBeLessThan(0.001);
  });

  test('should handle missing exchange rate', () => {
    loadExchangeRate();
    expect(eurUsdRate).toBe(1.0); // Default value
  });
});

describe('CS2 Portfolio Management', () => {
  beforeEach(() => {
    portfolio.cs2 = { portfolios: {} };
  });

  test('should initialize CS2 portfolios', () => {
    if (!portfolio.cs2.portfolios) {
      portfolio.cs2.portfolios = {};
    }
    
    portfolio.cs2.portfolios['testPortfolio'] = {
      name: 'Test Portfolio',
      description: 'Test description',
      color: 'blue',
      value: 100,
      currency: 'USD'
    };
    
    expect(portfolio.cs2.portfolios['testPortfolio']).toBeTruthy();
    expect(portfolio.cs2.portfolios['testPortfolio'].name).toBe('Test Portfolio');
  });

  test('should handle CS2 portfolio updates', () => {
    portfolio.cs2.portfolios['testPortfolio'] = {
      name: 'Test Portfolio',
      value: 100,
      currency: 'USD'
    };
    
    portfolio.cs2.portfolios['testPortfolio'].value = 150;
    
    expect(portfolio.cs2.portfolios['testPortfolio'].value).toBe(150);
  });
});

describe('Performance Tests', () => {
  test('should handle large dataset efficiently', () => {
    const startTime = performance.now();
    
    // Create large dataset
    const largePortfolio = {
      stocks: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `STOCK${i}`,
        quantity: Math.random() * 100,
        purchasePrice: Math.random() * 1000,
        currency: 'EUR'
      })),
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    
    portfolio = largePortfolio;
    saveData();
    loadData();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
    expect(portfolio.stocks.length).toBe(100);
  });
});
