# API Reference

## Module Functions

### calculator.js

```javascript
import { calculateRealizedPnL } from './modules/calculator.js';

// Calculate realized profit/loss
calculateRealizedPnL(transactions, portfolio, eurUsdRate)
// Returns: { stocks, etfs, crypto, cs2, total, byAsset }

// Calculate total portfolio value
calculateTotalValue(portfolio, priceCache, eurUsdRate)
// Returns: number (EUR)

// Calculate holding time
calculateHoldingTime(transactions, assetType, symbol)
// Returns: { years, months, daysRemainder, totalDays } or null

// Get transaction totals by type
getTransactionTotals(transactions)
// Returns: { stocks: { deposit, withdrawal }, etfs: {...}, crypto: {...} }
```

### formatter.js

```javascript
import { formatCurrency, formatQuantity } from './modules/formatter.js';

// Format as currency
formatCurrency(value, currency)
// currency: 'EUR' | 'USD'
// Returns: '€1,234.56' or '$1,234.56'

// Format quantity
formatQuantity(value)
// Returns: '1,234' or '0.00001234' for small values
```

### storage.js

```javascript
import { 
    loadPortfolioData, savePortfolioData,
    loadTransactions, saveTransactions, addTransaction,
    loadExchangeRateFromStorage, saveExchangeRateToStorage
} from './modules/storage.js';

// Portfolio data
loadPortfolioData() // Returns: object or null
savePortfolioData(data)

// Transactions
loadTransactions() // Returns: array
saveTransactions(transactions)
addTransaction(transaction)

// Exchange rate
loadExchangeRateFromStorage() // Returns: number (default 1.0)
saveExchangeRateToStorage(rate)
```

### state.js

```javascript
import {
    portfolio, priceCache, eurUsdRate,
    setPortfolio, setPriceCache, setEurUsdRate,
    getPortfolio, getPriceCache, getEurUsdRate
} from './modules/state.js';

// Get state
const portfolio = getPortfolio();
const rate = getEurUsdRate();

// Set state
setPortfolio(newPortfolio);
setPriceCache(newCache);
setEurUsdRate(1.085);
```

## Global Functions (shared.js)

These are exposed globally for legacy page scripts:

```javascript
// Data management
loadData()           // Load from localStorage
saveData()           // Save to localStorage

// Price fetching
fetchAllAssetPrices()  // Fetch all prices
fetchStockPrice(ticker) // Single stock price
fetchCryptoPrice(name, currency) // Single crypto price
fetchExchangeRate()     // EUR/USD rate

// P&L
calculateRealizedPnL(transactions) // Uses global portfolio

// CS2
window.fetchPricempireData(force) // Force refresh optional
```

## Data Structures

### Portfolio

```javascript
{
    stocks: [{ name, quantity, price, currency, date }],
    etfs: [{ name, quantity, price, currency, date }],
    crypto: [{ name, quantity, price, currency, date }],
    static: [{ id, name, type, values: [{date, value, currency}] }],
    cs2: {
        portfolios: {
            'id': { name, description, color, value, realizedPnl, currency }
        },
        value: number,
        currency: 'EUR'
    }
}
```

### Transaction

```javascript
{
    id: string,
    type: 'buy' | 'sell',
    assetType: 'stocks' | 'etfs' | 'crypto' | 'cs2',
    symbol: string,
    quantity: number,
    price: number,
    total: number,
    date: string (YYYY-MM-DD),
    currency: 'EUR' | 'USD',
    originalPrice: number,  // Price in original currency
    originalCurrency: string,
    historicalRate: number  // EUR/USD rate at transaction time
}
```

### Price Cache

```javascript
{
    stocks: { 'AAPL': { price: 150.00, timestamp: 1234567890 } },
    crypto: { 'bitcoin': { price: 50000.00, timestamp: 1234567890 } },
    etfs: {}
}
```

## Event Hooks

```javascript
// In shared.js, called automatically:
// loadData() on page load
// saveData() after modifications
// fetchAllAssetPrices() on first load + hourly
```

## Configuration Constants

```javascript
const CORS_PROXY = 'https://corsproxy.io/?';  // API proxy
const PRICEMPIRE_CACHE_DURATION = 60 * 60 * 1000;  // 1 hour
```
