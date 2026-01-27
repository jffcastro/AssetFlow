# AssetFlow - Documentation

A comprehensive portfolio management application for tracking stocks, ETFs, cryptocurrencies, static assets, and CS2 items.

## Quick Start

### Running the Application

**Option 1 - Direct Open:**
```bash
# Open dashboard.html in your browser
open dashboard.html
```

**Option 2 - Local Server:**
```bash
# Using Python
python -m http.server 8000

# Then open http://localhost:8000/dashboard.html
```

**Option 3 - Node.js:**
```bash
npx serve .
```

## Project Structure

```
AssetFlow/
├── js/
│   ├── modules/           # ES6 Modules (core functionality)
│   │   ├── calculator.js  # Financial calculations
│   │   ├── formatter.js   # Currency/number formatting
│   │   ├── state.js       # State management
│   │   ├── storage.js     # localStorage persistence
│   │   └── ui.js          # UI utilities
│   ├── shared.js          # Shared utilities (legacy)
│   ├── cs2.js             # CS2 skin tracking
│   ├── crypto.js          # Cryptocurrency tracking
│   ├── stocks.js          # Stock tracking
│   ├── dashboard.js       # Dashboard view
│   └── ...
├── tests/                 # Test suite
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── *.html                 # Page files
└── package.json           # Project config & tests
```

## Features

| Feature | Description |
|---------|-------------|
| Multi-Asset | Stocks, ETFs, Crypto, Static Assets, CS2 |
| Price Tracking | Real-time prices via APIs |
| P&L Analysis | Realized & unrealized profit/loss |
| Transactions | Buy/Sell, Deposits/Withdrawals |
| CS2 Integration | Pricempire API support |

## Testing

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific test types
pnpm run test:unit      # Unit tests only
pnpm run test:integration # Integration tests
```

## API Keys (Optional)

Configure API keys for enhanced features:
- **Finnhub** - Stock earnings calendar
- **CoinMarketCal** - Crypto events
- **Pricempire** - CS2 skin prices

## Architecture

### Modules (`js/modules/`)

- **calculator.js** - P&L, holdings, total value calculations
- **formatter.js** - Currency & number formatting
- **state.js** - Centralized state management
- **storage.js** - localStorage persistence
- **ui.js** - Notifications, UI updates

### Data Flow

```
User Action → State Update → Storage Save → UI Render
```

### Currency System

- Base currency: EUR
- Exchange rates via Frankfurter API
- Historical rates stored per transaction

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## Privacy

- All data stored locally in browser
- No external servers for data storage
- API calls only for price data

## Development

### Adding New Features

1. Create module functions in `js/modules/`
2. Export functions
3. Import in page-specific scripts
4. Add tests in `tests/`

### Running Tests

```bash
# Watch mode
pnpm run test:watch

# CI mode
pnpm run test:ci
```

## License

MIT
