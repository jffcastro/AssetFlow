# Copilot Instructions for AssetFlow

## Project Overview
AssetFlow is a browser-only portfolio management app tracking stocks, ETFs, cryptocurrencies, static assets (cash/savings), and CS2 items. Built with vanilla JavaScript (ES6+), HTML5, and CSS3 (Tailwind). No backend—all data persists in browser localStorage.

## Architecture & Data Flow

### Page-Module Pattern
Each asset type = one HTML page + one JS module:
- `stocks.html` → `js/stocks.js`
- `crypto.html` → `js/crypto.js`
- `etfs.html` → `js/etfs.js`
- `cs2.html` → `js/cs2.js`
- `static-assets.html` → `js/static-assets.js`
- `deposits-withdrawals.html` → `js/deposits-withdrawals.js`
- `dashboard.html` → `js/dashboard.js` (aggregates all data)

**Script Loading Order (critical):** Every HTML page must load scripts in this exact order:
1. External dependencies (Tailwind, Chart.js, lz-string)
2. `js/shared.js` (must load first—provides global state and utilities)
3. Page-specific JS (e.g., `js/stocks.js`)
4. `js/theme-switcher.js` (last—modifies DOM)

### Global State & localStorage Keys
All portfolio data lives in `js/shared.js` in the `portfolio` object:
```javascript
let portfolio = {
    stocks: [],      // [{id, name, quantity, purchasePrice, currency, currentPrice}]
    etfs: [],        // Same structure as stocks
    crypto: [],      // [{id, name, quantity, purchasePrice, currency, currentPrice}]
    static: [],      // [{id, name, type, values: [{date, value, currency}]}]
    cs2: {           // Nested structure with multiple portfolios
        portfolios: {},
        value: 0,
        currency: 'EUR',
        pendingFunds: {total: 0, breakdown: {}}
    }
};
```

**localStorage Schema (prefix: `portfolioPilot`):**
- `portfolioPilotData` – Main portfolio object (JSON)
- `portfolioPilotTransactions` – Buy/sell transactions array
- `portfolioPilotDeposits` – Deposit/withdrawal transactions
- `eurUsdRate` – Current EUR/USD exchange rate
- `historicalRates` – Historical EUR/USD rates by date (YYYY-MM-DD)
- `soldAssetsCache` – Cached prices for fully sold assets
- `portfolioPilotPriceCache` – Cached stock/crypto prices
- `portfolioPilotBenchmarkData` – S&P 500/NASDAQ data for charts
- `portfolioPilotLastUpdate` – Timestamp of last price update
- `assetflow-theme` – Current theme ('glass' or 'dark')

**Critical Data Persistence Pattern:**
```javascript
loadData();      // On page load (DOMContentLoaded)
saveData();      // After every user action (add/edit/delete)
loadExchangeRate(); // Loads EUR/USD rate, fetches if missing
```

### Currency & Exchange Rate Handling
- **Primary currency:** EUR (all portfolio totals calculated in EUR)
- **Supported currencies:** EUR, USD, BTC, ETH
- **Exchange rates:** 
  - Current: `eurUsdRate` (fetched from Frankfurter API)
  - Historical: `historicalRates` object (YYYY-MM-DD → rate)
  - Function: `fetchHistoricalExchangeRate(date)` for transaction-time rates
- **Crypto conversion:** BTC/ETH → USD → EUR (two-step conversion)

### Realized P&L Calculation (FIFO)
Implemented in `calculateRealizedPnL(transactions)` using FIFO (First-In-First-Out):
1. Group transactions by `assetType` and `symbol`
2. Sort buys by date (oldest first)
3. Match sells against oldest buys until sell quantity exhausted
4. Track P&L per asset in `realizedPnL.byAsset[assetType-symbol]`
5. CS2 P&L is manually entered (not calculated from transactions)

**Key insight:** Uses `originalPrice` and `historicalRate` from transactions to avoid currency fluctuation effects.

## API Integration Patterns

### Stock/ETF Price Fetching (Yahoo Finance)
```javascript
// In js/shared.js
async function fetchStockPrice(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    // Returns: {price, change, changePercent, currency}
}
```

### Crypto Price Fetching (CoinGecko)
```javascript
async function fetchCryptoPrice(cryptoName, currency = 'USD') {
    // cryptoName must be lowercase (e.g., 'bitcoin', 'ethereum')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoName}&vs_currencies=${currency}`;
    // Returns: {price, change24h}
}
```

### Exchange Rates (Frankfurter)
```javascript
async function fetchExchangeRate() {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
    // Stores rate in eurUsdRate and localStorage
}
```

**Price Update Strategy:** 
- Prices cached in `priceCache` object
- `fetchAndUpdatePrices()` updates all active assets
- Sold assets cached separately in `soldAssetsCache`
- Dashboard triggers global price update every 5 minutes

## Developer Workflows

### Running Locally
```bash
# Option 1: Direct file access
open dashboard.html  # or index.html

# Option 2: Static server (preferred for CORS)
python -m http.server 8000
# Then visit: http://localhost:8000/dashboard.html
```

### Testing
**Browser-based testing (current method):**
1. Open `tests/test-suite.html` in browser
2. Click "Run All Tests"
3. View results in browser console

**Jest tests (configured but not fully implemented):**
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

### Debugging Price Issues
1. Check `priceCache` object in console: `console.log(priceCache)`
2. Check localStorage: `localStorage.getItem('portfolioPilotPriceCache')`
3. For sold assets: `console.log(soldAssetsCache)`
4. Manually trigger price update: `fetchAndUpdatePrices()`

### Adding a New Asset Type
1. Create `{type}.html` (copy structure from `stocks.html`)
2. Create `js/{type}.js` with DOMContentLoaded listener
3. Add asset array to `portfolio` object in `js/shared.js`
4. Update `loadData()` and `saveData()` to handle new type
5. Add navigation link in all HTML headers
6. Add chart/metrics to `dashboard.js` if needed

## Project-Specific Conventions

### No Frameworks Rule
- **Strictly vanilla JS** – no React, Vue, Angular, jQuery
- **ES6+ features OK:** arrow functions, destructuring, async/await, template literals
- **External libraries OK:** Tailwind (CDN), Chart.js (CDN), lz-string (compression)

### Error Handling Pattern
```javascript
// ❌ DON'T use browser alerts
alert('Error occurred!');

// ✅ DO use in-page notifications
showNotification('Error occurred', 'error');
// or modal with proper styling
```

### Theme System
Two themes: `glass-theme.css` (default) and `dark-theme.css`
- Switched via `ThemeSwitcher` class in `js/theme-switcher.js`
- Theme stored in `localStorage.getItem('assetflow-theme')`
- Dynamically injects `<link>` tag with correct CSS file
- Updates `<body>` class to `glass-theme` or `dark-theme`

### Transaction System
Two transaction types:
1. **Buy/Sell transactions** (`portfolioPilotTransactions`):
   - Fields: `{id, type, assetType, symbol, quantity, price, total, currency, date, historicalRate, originalPrice}`
   - Used for: stocks, ETFs, crypto, CS2
   
2. **Deposit/Withdrawal transactions** (`portfolioPilotDeposits`):
   - Fields: `{id, type, amount, assetType, date, notes}`
   - Used for: tracking cash flows across all asset types

**Critical:** Always store `historicalRate` and `originalPrice` in USD for accurate P&L calculations.

### Code Organization in shared.js
File uses comment headers for navigation:
```javascript
// --- STATE MANAGEMENT ---
// --- DATA PERSISTENCE ---
// --- HISTORICAL EXCHANGE RATES ---
// --- SOLD ASSETS CACHE ---
// --- REALIZED P&L CALCULATIONS ---
```
When adding new utilities, maintain this pattern.

## Common Gotchas

1. **localStorage key mismatch:** Original app was "PortfolioPilot", keys still use `portfolioPilot` prefix
2. **Crypto names:** Must use CoinGecko IDs (lowercase: `bitcoin`, not `BTC`)
3. **Currency conversions:** Always convert through USD as intermediate (never BTC → EUR direct)
4. **CS2 structure:** Nested `portfolios` object, not flat array like other assets
5. **Script load order:** `shared.js` MUST load before page-specific JS
6. **Price caching:** Check both `priceCache` and `soldAssetsCache` for sold assets
7. **Date formats:** Use ISO format `YYYY-MM-DD` for historical rate lookups

## Key Files Reference
- `js/shared.js` (2626 lines) – Core logic, all utility functions, API calls
- `js/dashboard.js` (2053 lines) – Charts, metrics, portfolio aggregation
- `js/stocks.js` (1092 lines) – Stock management, transaction UI
- `js/theme-switcher.js` (153 lines) – Theme switching class
- `css/glass-theme.css` – Default glassmorphism theme
- `css/dark-theme.css` – Dark mode alternative

## Examples from Codebase

**Adding a new stock:**
```javascript
// In stocks.js
function saveStock() {
    const stock = {
        id: stockIdInput.value || Date.now().toString(),
        name: stockNameInput.value.toUpperCase(),
        quantity: parseFloat(stockQuantityInput.value),
        purchasePrice: parseFloat(stockPurchasePriceInput.value),
        currency: stockCurrencySelect.value,
        currentPrice: 0
    };
    portfolio.stocks.push(stock);
    saveData();
    renderStocks();
}
```

**Fetching prices with error handling:**
```javascript
// In shared.js
async function fetchStockPrice(symbol) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
        const data = await response.json();
        return {
            price: data.chart.result[0].meta.regularMarketPrice,
            change: data.chart.result[0].meta.regularMarketChange,
            changePercent: data.chart.result[0].meta.regularMarketChangePercent
        };
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null;
    }
}
```

---

**When in doubt:** Check `js/shared.js` for utility functions, `dashboard.js` for chart patterns, or any asset page for UI interaction patterns.
