# AssetFlow

A comprehensive portfolio management web application for tracking stocks, ETFs, cryptocurrencies, static assets, and Counter-Strike 2 items. Built with vanilla JavaScript, HTML, and CSS, AssetFlow provides real-time portfolio tracking, performance analytics, and transaction management.

![AssetFlow Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5](https://img.shields.io/badge/HTML5-Latest-orange)
![CSS3](https://img.shields.io/badge/CSS3-Tailwind-blue)

## 🚀 Features

### 📊 Portfolio Management
- **Multi-Asset Support**: Track stocks, ETFs, cryptocurrencies, cash, savings, and CS2 items
- **Real-Time Pricing**: Automatic price updates from Yahoo Finance and CoinGecko APIs
- **Multi-Currency Support**: Handle EUR, USD, BTC, and ETH with automatic conversion
- **Portfolio Breakdown**: Visual pie charts and allocation analysis
- **Performance Tracking**: P&L calculations, percentage gains/losses, and performance metrics

### 📈 Analytics & Reporting
- **Interactive Charts**: Portfolio history, multi-currency comparison, and benchmark analysis
- **Performance Metrics**: Daily returns, best/worst performers, and correlation analysis
- **Retirement Planning**: Growth projections with customizable contribution and return rates
- **Benchmark Comparison**: Compare portfolio performance against S&P 500 and NASDAQ
- **Monthly/Yearly Summaries**: Performance tracking over different time periods

### 💰 Transaction Management
- **Buy/Sell Tracking**: Record all transactions with detailed information
- **Deposit/Withdrawal Logging**: Track cash flows across different asset types
- **Transaction History**: Complete audit trail of all portfolio activities
- **Cash Flow Analysis**: Net cash flow calculations and summaries

### 🔧 Advanced Features
- **API Integration**: Support for Finnhub (earnings calendar) and CoinMarketCal (crypto events)
- **Data Export/Import**: CSV export/import functionality for portfolio data
- **Backup & Restore**: Complete data backup and restoration system
- **Notes System**: Add notes to each asset category for personal tracking
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript (ES6+)
- **Charts**: Chart.js for interactive data visualization
- **APIs**: Yahoo Finance, CoinGecko, Frankfurter (exchange rates), Finnhub, CoinMarketCal
- **Storage**: Browser localStorage for data persistence
- **Styling**: Tailwind CSS for responsive design

## 📁 Project Structure

```
assetflow/
├── 📄 HTML Pages
│   ├── dashboard.html          # Main dashboard with charts and metrics
│   ├── stocks.html            # Stock portfolio management
│   ├── etfs.html              # ETF portfolio management
│   ├── crypto.html            # Cryptocurrency portfolio management
│   ├── static-assets.html     # Cash, savings, and static assets
│   ├── cs2.html              # Counter-Strike 2 items management
│   ├── deposits-withdrawals.html # Transaction tracking
│   └── api-keys.html         # API key configuration
├── 📁 js/
│   ├── shared.js             # Common functionality and utilities
│   ├── dashboard.js          # Dashboard-specific features
│   ├── stocks.js             # Stock management functionality
│   ├── etfs.js               # ETF management functionality
│   ├── crypto.js             # Cryptocurrency management functionality
│   ├── static-assets.js      # Static assets management
│   ├── cs2.js                # CS2 items management
│   ├── deposits-withdrawals.js # Transaction management
│   └── api-keys.js           # API key management
├── 📁 tests/
│   ├── test-suite.html       # Comprehensive test runner
│   ├── unit-tests.js         # Unit tests for individual functions
│   ├── integration-tests.js  # Integration tests for component interaction
│   └── README.md            # Test documentation
├── README.md                 # This file
└── .gitignore               # Git ignore patterns
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/assetflow.git
   cd assetflow
   ```

2. **Open the application**
   - Simply open `dashboard.html` in your web browser
   - Or serve the files using a local web server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Start using AssetFlow**
   - Navigate to the dashboard to see your portfolio overview
   - Add assets using the respective pages (Stocks, ETFs, Crypto, etc.)
   - Configure API keys for enhanced features (optional)

## 📖 Usage Guide

### Adding Assets

1. **Stocks & ETFs**
   - Navigate to Stocks or ETFs page
   - Click "Add Stock/ETF" button
   - Enter symbol, quantity, purchase price, and currency
   - Prices are automatically fetched from Yahoo Finance

2. **Cryptocurrencies**
   - Go to Crypto page
   - Add cryptocurrency by name (e.g., "bitcoin", "ethereum")
   - Enter quantity and purchase price
   - Prices are fetched from CoinGecko API

3. **Static Assets**
   - Visit Cash & Savings page
   - Add savings accounts, emergency funds, or cash
   - Support for yield accounts with interest rate tracking

4. **CS2 Items**
   - Go to CS2 Items page
   - Create custom portfolios for different item categories
   - Track values in USD with automatic EUR conversion

### Recording Transactions

1. **Buy/Sell Transactions**
   - Use the Buy/Sell buttons on asset pages
   - Record detailed transaction information
   - Automatic portfolio updates

2. **Deposits/Withdrawals**
   - Navigate to Deposits & Withdrawals page
   - Log cash flows for different asset types
   - Track net cash flow over time

### Viewing Analytics

1. **Dashboard Overview**
   - Total portfolio value in multiple currencies
   - Performance metrics and key statistics
   - Interactive charts and visualizations

2. **Portfolio History**
   - Click "Add to History" to record daily snapshots
   - View portfolio growth over time
   - Compare performance across different periods

## 🔧 Configuration

### API Keys (Optional)

For enhanced features, configure API keys:

1. **Finnhub API** (Free tier available)
   - Provides earnings calendar for stocks
   - Get your API key at [finnhub.io](https://finnhub.io)

2. **CoinMarketCal API** (Free tier available)
   - Provides cryptocurrency events and news
   - Get your API key at [coinmarketcal.com](https://coinmarketcal.com)

### Data Management

- **Backup**: Use the "Backup Data" button to download a complete backup
- **Restore**: Use the "Restore Data" button to restore from a backup file

## 🧪 Testing

AssetFlow includes a comprehensive test suite:

### Running Tests

1. **Web Interface** (Recommended)
   - Open `tests/test-suite.html` in your browser
   - Click "Run All Tests" to execute the complete test suite
   - View detailed results with pass/fail indicators

2. **Console Tests**
   - Open browser developer console
   - Load and run test files directly

### Test Coverage

- ✅ **Unit Tests**: Individual function testing
- ✅ **Integration Tests**: Component interaction testing
- ✅ **Performance Tests**: Large dataset handling
- ✅ **Error Handling**: Graceful error management
- ✅ **Edge Cases**: Boundary condition testing

## 🔒 Data Privacy & Security

- **Local Storage**: All data is stored locally in your browser
- **No Server**: No data is sent to external servers (except for price APIs)
- **API Keys**: Stored locally and only used for legitimate API calls
- **Backup**: You control your data with local backup/restore functionality

### Development Setup

1. Clone the repository
2. Open in your preferred code editor
3. Use a local web server for development
4. Run tests before submitting changes

## 🆘 Support

### Common Issues

1. **Prices not updating**
   - Check your internet connection
   - Verify API endpoints are accessible
   - Try refreshing the page

2. **Data not saving**
   - Ensure localStorage is enabled in your browser
   - Check browser storage limits
   - Try clearing browser cache

3. **Charts not displaying**
   - Ensure Chart.js is loading properly
   - Check browser console for errors
   - Verify data format is correct

## 🙏 Acknowledgments

- **Yahoo Finance** for stock and ETF price data
- **CoinGecko** for cryptocurrency price data
- **Frankfurter** for exchange rate data
- **Chart.js** for beautiful data visualizations
- **Tailwind CSS** for responsive design framework

---

**AssetFlow** - Your comprehensive portfolio management solution. Track, analyze, and optimize your investments with ease.

*Built with ❤️ for investors and traders who want full control over their portfolio data.*
