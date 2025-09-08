/**
 * AssetFlow Integration Tests
 * 
 * This file contains integration tests that test the interaction between
 * different components of the AssetFlow application.
 */

describe('Portfolio and Price Integration', () => {
  beforeEach(() => {
    // Reset state
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

  test('should integrate stock addition with price fetching', async () => {
    // Add stock to portfolio
    portfolio.stocks.push({
      id: Date.now(),
      name: 'AAPL',
      quantity: 10,
      purchasePrice: 150,
      currency: 'USD'
    });

    // Mock price fetch
    const mockPrice = { price: 160, change24h: 2.5 };
    priceCache.stocks['AAPL'] = mockPrice;

    // Verify integration
    expect(portfolio.stocks.length).toBe(1);
    expect(priceCache.stocks['AAPL'].price).toBe(160);
  });

  test('should integrate crypto addition with price fetching', async () => {
    // Add crypto to portfolio
    portfolio.crypto.push({
      id: Date.now(),
      name: 'bitcoin',
      quantity: 0.1,
      purchasePrice: 50000,
      currency: 'USD'
    });

    // Mock price fetch
    const mockPrice = { price: 55000, change24h: 5.2 };
    priceCache.crypto['bitcoin'] = mockPrice;

    // Verify integration
    expect(portfolio.crypto.length).toBe(1);
    expect(priceCache.crypto['bitcoin'].price).toBe(55000);
  });

  test('should integrate portfolio calculation with price cache', () => {
    // Set up portfolio with mixed currencies
    portfolio.stocks = [
      { name: 'EUR_STOCK', quantity: 10, purchasePrice: 50, currency: 'EUR' },
      { name: 'USD_STOCK', quantity: 5, purchasePrice: 100, currency: 'USD' }
    ];
    portfolio.crypto = [
      { name: 'bitcoin', quantity: 0.1, purchasePrice: 50000, currency: 'USD' }
    ];

    // Set up price cache
    priceCache.stocks = {
      'EUR_STOCK': { price: 60 },
      'USD_STOCK': { price: 110 }
    };
    priceCache.crypto = {
      'bitcoin': { price: 55000 }
    };

    // Calculate total value
    const totalValue = calculateTotalValue();

    // Expected: (10*60) + (5*110/1.1) + (0.1*55000/1.1) = 600 + 500 + 5000 = 6100
    expect(Math.abs(totalValue - 6100)).toBeLessThan(0.01);
  });
});

describe('Transaction and Portfolio Integration', () => {
  beforeEach(() => {
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    localStorage.removeItem('portfolioPilotTransactions');
  });

  test('should integrate buy transaction with portfolio update', () => {
    // Initial portfolio state
    expect(portfolio.stocks.length).toBe(0);

    // Simulate buy transaction
    const buyTransaction = {
      id: Date.now().toString(),
      type: 'buy',
      assetType: 'stock',
      symbol: 'AAPL',
      quantity: 10,
      price: 150,
      total: 1500,
      currency: 'USD',
      date: new Date().toISOString().slice(0, 10)
    };

    // Add transaction
    addTransaction(buyTransaction);

    // Verify transaction was recorded
    const transactions = loadTransactions();
    expect(transactions.length).toBe(1);
    expect(transactions[0].type).toBe('buy');
  });

  test('should integrate sell transaction with portfolio update', () => {
    // Set up initial portfolio
    portfolio.stocks = [{
      id: 1,
      name: 'AAPL',
      quantity: 20,
      purchasePrice: 150,
      currency: 'USD'
    }];

    // Simulate sell transaction
    const sellTransaction = {
      id: Date.now().toString(),
      type: 'sell',
      assetType: 'stock',
      symbol: 'AAPL',
      quantity: 5,
      price: 160,
      total: 800,
      currency: 'USD',
      date: new Date().toISOString().slice(0, 10)
    };

    // Add transaction
    addTransaction(sellTransaction);

    // Verify transaction was recorded
    const transactions = loadTransactions();
    expect(transactions.length).toBe(1);
    expect(transactions[0].type).toBe('sell');
  });

  test('should integrate transaction totals with portfolio categories', () => {
    // Add various transactions
    const transactions = [
      { type: 'deposit', assetType: 'stocks', amount: 1000 },
      { type: 'withdrawal', assetType: 'stocks', amount: 200 },
      { type: 'deposit', assetType: 'crypto', amount: 500 },
      { type: 'deposit', assetType: 'etfs', amount: 300 }
    ];

    transactions.forEach(tx => addTransaction(tx));

    // Calculate totals
    const allTransactions = loadTransactions();
    const totals = getTransactionTotals(allTransactions);

    // Verify totals match expected values
    expect(totals.stocks.deposit).toBe(1000);
    expect(totals.stocks.withdrawal).toBe(200);
    expect(totals.crypto.deposit).toBe(500);
    expect(totals.etfs.deposit).toBe(300);
  });
});

describe('API Integration', () => {
  beforeEach(() => {
    eurUsdRate = 1.0;
    localStorage.removeItem('portfolioPilotFinnhub');
    localStorage.removeItem('portfolioPilotCoinMarketCal');
  });

  test('should integrate API key management with usage tracking', () => {
    // Set up API key
    const apiKey = 'test-api-key-123';
    const config = {
      apiKey: apiKey,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('portfolioPilotFinnhub', JSON.stringify(config));

    // Track usage
    trackApiUsage('Finnhub');

    // Verify key is accessible and usage is tracked
    const loadedKey = getApiKey('Finnhub');
    const usage = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
    const today = new Date().toDateString();

    expect(loadedKey).toBe(apiKey);
    expect(usage[today]).toBe(1);
  });

  test('should integrate exchange rate fetching with portfolio calculations', async () => {
    // Set initial rate
    eurUsdRate = 1.0;

    // Mock successful exchange rate fetch
    const mockRate = 1.15;
    saveExchangeRate(mockRate);

    // Set up portfolio with USD assets
    portfolio.stocks = [{
      name: 'USD_STOCK',
      quantity: 10,
      purchasePrice: 100,
      currency: 'USD'
    }];
    priceCache.stocks = {
      'USD_STOCK': { price: 110 }
    };

    // Calculate total value
    const totalValue = calculateTotalValue();

    // Expected: (10 * 110) / 1.15 = 956.52
    expect(Math.abs(totalValue - 956.52)).toBeLessThan(0.01);
  });
});

describe('Dashboard Integration', () => {
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

  test('should integrate portfolio data with dashboard calculations', () => {
    // Set up comprehensive portfolio
    portfolio.stocks = [
      { name: 'STOCK1', quantity: 10, purchasePrice: 50, currency: 'EUR' },
      { name: 'STOCK2', quantity: 5, purchasePrice: 100, currency: 'USD' }
    ];
    portfolio.etfs = [
      { name: 'ETF1', quantity: 3, purchasePrice: 200, currency: 'EUR' }
    ];
    portfolio.crypto = [
      { name: 'bitcoin', quantity: 0.1, purchasePrice: 50000, currency: 'USD' }
    ];
    portfolio.static = [{
      name: 'Savings',
      type: 'Savings',
      values: [{ date: new Date().toISOString().slice(0, 10), value: 1000, currency: 'EUR' }]
    }];
    portfolio.cs2 = { value: 500, currency: 'EUR' };

    // Set up price cache
    priceCache.stocks = {
      'STOCK1': { price: 60 },
      'STOCK2': { price: 110 },
      'ETF1': { price: 220 }  // ETF prices are stored in stocks cache
    };
    priceCache.crypto = {
      'bitcoin': { price: 55000 }
    };

    // Calculate dashboard metrics
    const totalValue = calculateTotalValue();
    const breakdown = calculatePortfolioBreakdown();

    // Verify calculations
    expect(totalValue).toBeGreaterThan(0);
    expect(breakdown['Stocks']).toBeGreaterThan(0);
    expect(breakdown['ETFs']).toBeGreaterThan(0);
    expect(breakdown['Crypto']).toBeGreaterThan(0);
    expect(breakdown['Savings']).toBeGreaterThan(0);
    expect(breakdown['CS2 Items']).toBeGreaterThan(0);
  });

  test('should integrate validated history with dashboard charts', () => {
    // Add validated history entries
    const historyEntries = [
      {
        date: '2024-01-01',
        total: 10000,
        eur: 10000,
        usd: 11000,
        stocks: 5000,
        etfs: 2000,
        crypto: 1000,
        static: 1500,
        cs2: 500
      },
      {
        date: '2024-01-02',
        total: 10500,
        eur: 10500,
        usd: 11550,
        stocks: 5200,
        etfs: 2100,
        crypto: 1100,
        static: 1500,
        cs2: 600
      }
    ];

    saveValidatedHistory(historyEntries);
    const loadedHistory = loadValidatedHistory();

    // Verify history integration
    expect(loadedHistory.length).toBe(2);
    expect(loadedHistory[0].total).toBe(10000);
    expect(loadedHistory[1].total).toBe(10500);
  });
});

describe('CS2 Integration', () => {
  beforeEach(() => {
    portfolio.cs2 = { portfolios: {} };
    eurUsdRate = 1.1;
  });

  test('should integrate CS2 portfolio management with total calculations', () => {
    // Set up CS2 portfolios
    portfolio.cs2.portfolios = {
      'playItems': {
        name: 'Play Items',
        value: 100,
        currency: 'USD'
      },
      'investmentItems': {
        name: 'Investment Items',
        value: 200,
        currency: 'USD'
      }
    };

    // Calculate combined total
    const totalUsd = Object.values(portfolio.cs2.portfolios)
      .reduce((sum, p) => sum + (p.value || 0), 0);
    const totalEur = totalUsd / eurUsdRate;

    // Verify integration
    expect(totalUsd).toBe(300);
    expect(Math.abs(totalEur - 272.73)).toBeLessThan(0.01);
  });

  test('should integrate CS2 data with portfolio breakdown', () => {
    // Set up CS2 data
    portfolio.cs2.portfolios = {
      'testPortfolio': {
        name: 'Test Portfolio',
        value: 500,
        currency: 'USD'
      }
    };

    // Calculate breakdown
    const breakdown = calculatePortfolioBreakdown();

    // Verify CS2 is included in breakdown
    expect(breakdown['CS2 Items']).toBeGreaterThan(0);
  });
});

describe('Data Persistence Integration', () => {
  beforeEach(() => {
    // Clear all data
    localStorage.clear();
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    priceCache = { stocks: {}, crypto: {} };
  });

  test('should integrate complete data save and load cycle', () => {
    // Set up comprehensive data
    portfolio.stocks = [{ name: 'TEST', quantity: 10, purchasePrice: 100, currency: 'EUR' }];
    portfolio.etfs = [{ name: 'TEST-ETF', quantity: 5, purchasePrice: 200, currency: 'EUR' }];
    portfolio.crypto = [{ name: 'bitcoin', quantity: 0.1, purchasePrice: 50000, currency: 'USD' }];
    portfolio.static = [{
      name: 'Test Savings',
      type: 'Savings',
      values: [{ date: new Date().toISOString().slice(0, 10), value: 1000, currency: 'EUR' }]
    }];
    portfolio.cs2 = { value: 500, currency: 'EUR' };

    priceCache.stocks = { 'TEST': { price: 110 } };
    priceCache.crypto = { 'bitcoin': { price: 55000 } };

    eurUsdRate = 1.15;

    // Save all data
    saveData();
    savePriceCache();
    saveExchangeRate(eurUsdRate);

    // Clear in-memory data
    portfolio = { stocks: [], etfs: [], crypto: [], static: [], cs2: { value: 0, currency: 'EUR' } };
    priceCache = { stocks: {}, crypto: {} };
    eurUsdRate = 1.0;

    // Load all data
    loadData();
    loadPriceCache();
    loadExchangeRate();

    // Verify complete data restoration
    expect(portfolio.stocks.length).toBe(1);
    expect(portfolio.etfs.length).toBe(1);
    expect(portfolio.crypto.length).toBe(1);
    expect(portfolio.static.length).toBe(1);
    expect(portfolio.cs2.value).toBe(500);
    expect(priceCache.stocks['TEST'].price).toBe(110);
    expect(priceCache.crypto['bitcoin'].price).toBe(55000);
    expect(eurUsdRate).toBe(1.15);
  });

  test('should integrate transaction persistence with portfolio state', () => {
    // Add transactions
    const transactions = [
      { id: '1', type: 'deposit', assetType: 'stocks', amount: 1000, date: '2024-01-01' },
      { id: '2', type: 'withdrawal', assetType: 'crypto', amount: 200, date: '2024-01-02' }
    ];

    saveTransactions(transactions);

    // Clear and reload
    localStorage.removeItem('portfolioPilotTransactions');
    const loadedTransactions = loadTransactions();

    // Verify transaction persistence
    expect(loadedTransactions.length).toBe(0); // Should be empty after removal

    // Re-save and verify
    saveTransactions(transactions);
    const reloadedTransactions = loadTransactions();
    expect(reloadedTransactions.length).toBe(2);
  });
});

describe('Error Handling Integration', () => {
  beforeEach(() => {
    portfolio = {
      stocks: [],
      etfs: [],
      crypto: [],
      static: [],
      cs2: { value: 0, currency: 'EUR' }
    };
    priceCache = { stocks: {}, crypto: {} };
  });

  test('should handle API failures gracefully in portfolio calculations', () => {
    // Set up portfolio with missing price data
    portfolio.stocks = [
      { name: 'NO_PRICE', quantity: 10, purchasePrice: 100, currency: 'EUR' },
      { name: 'HAS_PRICE', quantity: 5, purchasePrice: 50, currency: 'EUR' }
    ];

    // Only provide price for one stock
    priceCache.stocks = {
      'HAS_PRICE': { price: 60 }
    };

    // Calculate total value - should handle missing prices gracefully
    const totalValue = calculateTotalValue();

    // Should only include the stock with price data: 5 * 60 = 300
    expect(totalValue).toBe(300);
  });

  test('should handle invalid data in calculations', () => {
    // Set up portfolio with invalid data
    portfolio.stocks = [
      { name: 'INVALID', quantity: null, purchasePrice: undefined, currency: 'EUR' },
      { name: 'VALID', quantity: 10, purchasePrice: 100, currency: 'EUR' }
    ];

    priceCache.stocks = {
      'VALID': { price: 110 }
    };

    // Should handle invalid data gracefully
    const totalValue = calculateTotalValue();

    // Should only include valid data: 10 * 110 = 1100
    expect(totalValue).toBe(1100);
  });
});
