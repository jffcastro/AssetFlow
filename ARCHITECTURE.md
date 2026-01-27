# Architecture Documentation

## Overview

AssetFlow is a client-side portfolio management application built with vanilla JavaScript. It runs entirely in the browser using localStorage for data persistence.

## Core Architecture

### Module System

The application uses ES6 modules for core functionality:

```
js/modules/
├── calculator.js    → Financial calculations
├── formatter.js     → Currency/number formatting
├── state.js         → State management
├── storage.js       → localStorage operations (with batched writes)
├── ui.js            → UI utilities
├── performance.js   → Performance utilities (debounce, cache, memoize)
└── index.js         → Re-exports all modules
```

### State Management

```javascript
// Central state (js/modules/state.js)
export let portfolio = {
    stocks: [],
    etfs: [],
    crypto: [],
    static: [],
    cs2: { portfolios: {}, value: 0, currency: 'EUR' }
};

export let priceCache = { stocks: {}, crypto: {}, etfs: {} };
export let eurUsdRate = 1.0;
```

### Data Persistence

Data is stored in localStorage with these keys:

| Key | Purpose |
|-----|---------|
| `portfolioPilotData` | Main portfolio data |
| `portfolioPilotPriceCache` | Cached prices (1-hour TTL) |
| `portfolioPilotTransactions` | Transaction history |
| `portfolioPilotDeposits` | Deposit/withdrawal records |
| `eurUsdRate` | Current EUR/USD rate |
| `historicalRates` | Historical exchange rates |

### Currency System

- **Base Currency:** EUR
- **Exchange Rates:** Frankfurter API (free, open)
- **Historical Rates:** Stored per transaction for accurate P&L
- **Conversion:** All values converted to EUR for unified view

```
Value (EUR) = Value (Original) / Historical Rate
```

## API Integration

### Price APIs

| Asset Type | API | Cache TTL |
|------------|-----|-----------|
| Stocks/ETFs | Yahoo Finance (via proxy) | 1 hour |
| Crypto | CoinGecko | 1 hour |
| CS2 Skins | Pricempire API | 1 hour |
| Exchange Rates | Frankfurter | 24 hours |

### CORS Handling

Browser requests use `allorigins.win` proxy for APIs that don't allow direct browser access:

```javascript
const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
```

## Page Structure

Each HTML page has corresponding JavaScript:

| Page | Script | Purpose |
|------|--------|---------|
| dashboard.html | dashboard.js | Overview & charts |
| stocks.html | stocks.js | Stock management |
| crypto.html | crypto.js | Crypto tracking |
| cs2.html | cs2.js | CS2 skin tracking |
| etfs.html | etfs.js | ETF management |

## Key Calculations

### Realized P&L (FIFO Method)

```javascript
// First-In-First-Out for calculating gains
function calculateRealizedPnL(transactions, portfolio, eurUsdRate) {
    // Match sells with earliest buys
    // Calculate gain = sell price - buy price (in EUR)
}
```

### Total Portfolio Value

```javascript
function calculateTotalValue(portfolio, priceCache, eurUsdRate) {
    return stocks + etfs + crypto + static + cs2;
    // All converted to EUR
}
```

## Testing Strategy

### Test Structure

```
tests/
├── setup.js           # Jest setup
├── polyfills.js       # Browser polyfills
├── unit/
│   ├── formatter.test.js
│   ├── calculator.test.js
│   ├── storage.test.js
│   └── state.test.js
└── integration/
    └── workflow.test.js
```

### Running Tests

```bash
pnpm test              # All tests
pnpm run test:unit     # Unit tests
pnpm run test:integration # Integration tests
```

## Performance Considerations

### Caching Strategy

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Price Cache | 1 hour | Reduce API calls for asset prices |
| Exchange Rates | 24 hours | EUR/USD, BTC, ETH rates |
| Benchmark Data | 1 hour | S&P 500, NASDAQ indices |
| Historical Rates | Persistent | Store all fetched historical rates |
| Crypto Rates | 1 hour | BTC/ETH EUR prices |

### Optimizations Implemented

#### 1. Batched LocalStorage Writes

Multiple sequential `localStorage.setItem()` calls are expensive due to synchronous I/O. The storage module now queues writes and flushes them in batches:

```javascript
// Before (3 separate I/O operations)
savePortfolioData(data);
savePriceCache(cache);
saveHistoricalRates(rates);

// After (1 I/O operation batch)
queueWrite('portfolioPilotData', data);
queueWrite('portfolioPilotPriceCache', cache);
queueWrite('historicalRates', rates);
flushWrites(); // Auto-flushes after 100ms if not called
```

#### 2. DOM Query Caching

Repeated `document.getElementById()` calls are cached:

```javascript
// js/modules/performance.js
export function getCachedElement(id) {
    if (domCache.has(id)) return domCache.get(id);
    const element = document.getElementById(id);
    if (element) domCache.set(id, element);
    return element;
}
```

#### 3. Debounced Save Operations

Save operations are debounced to prevent excessive writes:

```javascript
const saveData = debounce(() => {
    savePortfolioData(portfolio);
}, 500);
```

#### 4. Memoization with TTL

Expensive computations are memoized with automatic cache expiration:

```javascript
const getTotalValue = memoizeWithTTL(() => {
    // Expensive calculation
    return calculateTotalValue(portfolio, priceCache, eurUsdRate);
}, 300000); // 5 minute cache
```

#### 5. Auto Cleanup

Periodic cache cleanup prevents memory leaks:

```javascript
// Start auto-cleanup every 5 minutes
const cleanupInterval = startAutoCleanup(300000);

// Stop when no longer needed
stopAutoCleanup(cleanupInterval);
```

### Performance Metrics

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Multiple localStorage writes | N operations | 1 operation | O(n) → O(1) |
| DOM queries (repeated) | N getElementById | 1 cached lookup | O(n) → O(1) |
| Rapid save operations | Every change | Debounced 500ms | ~90% reduction |
| Expensive recalculations | Every render | Cached 5 min | ~95% reduction |

### Large Portfolio Optimization

For portfolios with 100+ assets:

1. **Batch API calls:** All asset prices fetch in parallel using `Promise.allSettled()`
2. **Chunked processing:** Large data operations split into chunks to avoid blocking
3. **Virtual scrolling:** Consider for large transaction lists (future improvement)

## Security Notes

- **Client-side only:** No server storage of personal data
- **API keys:** Stored locally, used only for intended APIs
- **Input validation:** Basic validation on user inputs
- **XSS protection:** No innerHTML with user data

## Future Improvements

See `PROPOSED_FEATURES.md` for:
- TypeScript migration
- Cloud sync (Supabase/Firebase)
- PWA support
- Advanced analytics
- Dividend tracking
