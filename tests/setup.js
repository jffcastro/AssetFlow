/**
 * Jest Test Setup
 * 
 * This file sets up the testing environment for AssetFlow tests.
 * It mocks browser APIs and sets up global variables needed for testing.
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Setup DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock document.getElementById
global.document.getElementById = jest.fn((id) => {
  const mockElement = {
    textContent: '',
    innerHTML: '',
    value: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
      toggle: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    style: {}
  };
  return mockElement;
});

// Mock document.querySelector
global.document.querySelector = jest.fn(() => null);
global.document.querySelectorAll = jest.fn(() => []);

// Mock window.alert, confirm, prompt
global.window.alert = jest.fn();
global.window.confirm = jest.fn(() => true);
global.window.prompt = jest.fn(() => '');

// Mock Chart.js
global.Chart = jest.fn(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn()
}));

// Initialize global variables that the application expects
global.portfolio = {
  stocks: [],
  etfs: [],
  crypto: [],
  static: [],
  cs2: { value: 0, currency: 'EUR' }
};

global.priceCache = { stocks: {}, crypto: {} };
global.eurUsdRate = 1.0;
global.eurBtcRate = 0.00002;
global.eurEthRate = 0.0003;

// Mock application functions
global.saveData = jest.fn(() => {
  localStorage.setItem('portfolioPilotData', JSON.stringify(portfolio));
});

global.loadData = jest.fn(() => {
  const data = localStorage.getItem('portfolioPilotData');
  if (data) {
    try {
      portfolio = JSON.parse(data);
    } catch (e) {
      portfolio = { stocks: [], etfs: [], crypto: [], static: [], cs2: { value: 0, currency: 'EUR' } };
    }
  }
});

global.savePriceCache = jest.fn(() => {
  localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(priceCache));
});

global.loadPriceCache = jest.fn(() => {
  const data = localStorage.getItem('portfolioPilotPriceCache');
  if (data) {
    try {
      priceCache = JSON.parse(data);
    } catch (e) {
      priceCache = { stocks: {}, crypto: {} };
    }
  }
});

global.loadTransactions = jest.fn(() => {
  const data = localStorage.getItem('portfolioPilotTransactions');
  return data ? JSON.parse(data) : [];
});

global.saveTransactions = jest.fn((transactions) => {
  localStorage.setItem('portfolioPilotTransactions', JSON.stringify(transactions));
});

global.addTransaction = jest.fn((transaction) => {
  const transactions = loadTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
});

global.loadValidatedHistory = jest.fn(() => {
  const data = localStorage.getItem('portfolioPilotValidatedHistory');
  return data ? JSON.parse(data) : [];
});

global.saveValidatedHistory = jest.fn((history) => {
  localStorage.setItem('portfolioPilotValidatedHistory', JSON.stringify(history));
});

global.formatCurrency = jest.fn((amount, currency) => {
  const symbols = { EUR: '€', USD: '$', BTC: '₿', ETH: 'Ξ' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

global.calculateTotalValue = jest.fn(() => {
  let total = 0;
  
  // Calculate stocks value
  portfolio.stocks.forEach(stock => {
    const price = priceCache.stocks[stock.name]?.price || 0;
    const value = stock.quantity * price;
    if (stock.currency === 'USD') {
      total += value / eurUsdRate;
    } else {
      total += value;
    }
  });
  
  // Calculate ETFs value
  portfolio.etfs.forEach(etf => {
    const price = priceCache.stocks[etf.name]?.price || 0;
    const value = etf.quantity * price;
    if (etf.currency === 'USD') {
      total += value / eurUsdRate;
    } else {
      total += value;
    }
  });
  
  // Calculate crypto value
  portfolio.crypto.forEach(crypto => {
    const price = priceCache.crypto[crypto.name]?.price || 0;
    const value = crypto.quantity * price;
    if (crypto.currency === 'USD') {
      total += value / eurUsdRate;
    } else {
      total += value;
    }
  });
  
  // Calculate static assets value
  portfolio.static.forEach(asset => {
    if (asset.values && asset.values.length > 0) {
      const latestValue = asset.values[asset.values.length - 1];
      if (latestValue.currency === 'USD') {
        total += latestValue.value / eurUsdRate;
      } else {
        total += latestValue.value;
      }
    }
  });
  
  // Add CS2 value
  if (portfolio.cs2) {
    if (portfolio.cs2.value) {
      // Legacy single value format
      if (portfolio.cs2.currency === 'USD') {
        total += portfolio.cs2.value / eurUsdRate;
      } else {
        total += portfolio.cs2.value;
      }
    } else if (portfolio.cs2.portfolios) {
      // New portfolios format
      Object.values(portfolio.cs2.portfolios).forEach(portfolio => {
        if (portfolio.value) {
          if (portfolio.currency === 'USD') {
            total += portfolio.value / eurUsdRate;
          } else {
            total += portfolio.value;
          }
        }
      });
    }
  }
  
  return total;
});

global.calculatePortfolioBreakdown = jest.fn(() => {
  const breakdown = {
    'Stocks': 0,
    'ETFs': 0,
    'Crypto': 0,
    'Savings': 0,
    'CS2 Items': 0
  };
  
  // Calculate stocks
  portfolio.stocks.forEach(stock => {
    const price = priceCache.stocks[stock.name]?.price || 0;
    const value = stock.quantity * price;
    if (stock.currency === 'USD') {
      breakdown['Stocks'] += value / eurUsdRate;
    } else {
      breakdown['Stocks'] += value;
    }
  });
  
  // Calculate ETFs
  portfolio.etfs.forEach(etf => {
    const price = priceCache.stocks[etf.name]?.price || 0;
    const value = etf.quantity * price;
    if (etf.currency === 'USD') {
      breakdown['ETFs'] += value / eurUsdRate;
    } else {
      breakdown['ETFs'] += value;
    }
  });
  
  // Calculate crypto
  portfolio.crypto.forEach(crypto => {
    const price = priceCache.crypto[crypto.name]?.price || 0;
    const value = crypto.quantity * price;
    if (crypto.currency === 'USD') {
      breakdown['Crypto'] += value / eurUsdRate;
    } else {
      breakdown['Crypto'] += value;
    }
  });
  
  // Calculate static assets
  portfolio.static.forEach(asset => {
    if (asset.values && asset.values.length > 0) {
      const latestValue = asset.values[asset.values.length - 1];
      if (latestValue.currency === 'USD') {
        breakdown['Savings'] += latestValue.value / eurUsdRate;
      } else {
        breakdown['Savings'] += latestValue.value;
      }
    }
  });
  
  // Calculate CS2
  if (portfolio.cs2) {
    if (portfolio.cs2.value) {
      // Legacy single value format
      if (portfolio.cs2.currency === 'USD') {
        breakdown['CS2 Items'] += portfolio.cs2.value / eurUsdRate;
      } else {
        breakdown['CS2 Items'] += portfolio.cs2.value;
      }
    } else if (portfolio.cs2.portfolios) {
      // New portfolios format
      Object.values(portfolio.cs2.portfolios).forEach(portfolio => {
        if (portfolio.value) {
          if (portfolio.currency === 'USD') {
            breakdown['CS2 Items'] += portfolio.value / eurUsdRate;
          } else {
            breakdown['CS2 Items'] += portfolio.value;
          }
        }
      });
    }
  }
  
  return breakdown;
});

global.getTransactionTotals = jest.fn((transactions) => {
  const totals = {
    stocks: { deposit: 0, withdrawal: 0 },
    etfs: { deposit: 0, withdrawal: 0 },
    crypto: { deposit: 0, withdrawal: 0 },
    static: { deposit: 0, withdrawal: 0 }
  };
  
  transactions.forEach(transaction => {
    if (totals[transaction.assetType]) {
      if (transaction.type === 'deposit') {
        totals[transaction.assetType].deposit += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        totals[transaction.assetType].withdrawal += transaction.amount;
      }
    }
  });
  
  return totals;
});

global.getApiKey = jest.fn((service) => {
  const data = localStorage.getItem(`portfolioPilot${service}`);
  if (data) {
    try {
      const config = JSON.parse(data);
      return config.apiKey;
    } catch (e) {
      return null;
    }
  }
  return null;
});

global.trackApiUsage = jest.fn((service) => {
  const today = new Date().toDateString();
  const usage = JSON.parse(localStorage.getItem(`portfolioPilot${service}Usage`) || '{}');
  usage[today] = (usage[today] || 0) + 1;
  localStorage.setItem(`portfolioPilot${service}Usage`, JSON.stringify(usage));
});

global.saveExchangeRate = jest.fn((rate) => {
  localStorage.setItem('eurUsdRate', rate.toString());
  eurUsdRate = rate;
});

global.loadExchangeRate = jest.fn(() => {
  const data = localStorage.getItem('eurUsdRate');
  if (data) {
    eurUsdRate = parseFloat(data);
  }
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  
  // Reset global state
  portfolio = {
    stocks: [],
    etfs: [],
    crypto: [],
    static: [],
    cs2: { value: 0, currency: 'EUR' }
  };
  priceCache = { stocks: {}, crypto: {} };
  eurUsdRate = 1.0;
  eurBtcRate = 0.00002;
  eurEthRate = 0.0003;
});
