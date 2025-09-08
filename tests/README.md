# AssetFlow Test Suite

This directory contains the comprehensive test suite for the AssetFlow portfolio management application.

## Test Structure

### Test Files
- `setup.js` - Jest test environment setup and global mocks
- `unit-tests.test.js` - Unit tests for individual functions and components
- `integration-tests.test.js` - Integration tests for component interactions

### Test Categories

#### Unit Tests
- **Data Management** - Save/load functionality, persistence
- **Portfolio Operations** - Add/edit/delete assets (stocks, ETFs, crypto, static, CS2)
- **Transaction Management** - Buy/sell operations, deposits/withdrawals
- **Validation History** - Historical data management
- **Utility Functions** - Currency formatting, calculations
- **Portfolio Calculations** - Total value, breakdown calculations
- **API Key Management** - Key storage and validation
- **Exchange Rate Management** - Rate fetching and caching
- **CS2 Portfolio Management** - Counter-Strike 2 item tracking
- **Performance Tests** - Large dataset handling

#### Integration Tests
- **Portfolio and Price Integration** - Asset management with price data
- **Transaction and Portfolio Integration** - Transaction recording and portfolio updates
- **API Integration** - API key management and usage tracking
- **Dashboard Integration** - Portfolio data with dashboard calculations
- **CS2 Integration** - CS2 portfolio management with total calculations
- **Data Persistence Integration** - Complete save/load cycles
- **Error Handling Integration** - Graceful failure scenarios

## Running Tests

### Local Development
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests (no coverage needed for mock-based testing)
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance
```

### CI/CD (GitHub Actions)
Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI pipeline includes:
- Unit and integration tests
- Security audit
- Performance testing
- Build validation

## Test Environment

### Mocked APIs
- **localStorage** - Browser storage simulation
- **fetch** - HTTP requests for price data and APIs
- **DOM APIs** - Document manipulation and element access
- **Chart.js** - Chart rendering library
- **Performance API** - Timing measurements

### Global Variables
- `portfolio` - Main portfolio data structure
- `priceCache` - Cached price data
- `eurUsdRate`, `eurBtcRate`, `eurEthRate` - Exchange rates

### Mock Functions
All application functions are mocked to provide the same interface as the real application:
- `saveData()`, `loadData()` - Portfolio persistence
- `calculateTotalValue()` - Portfolio calculations
- `formatCurrency()` - Currency formatting
- `addTransaction()` - Transaction management
- And many more...

## Test Coverage

The test suite provides comprehensive coverage of:
- ✅ Data persistence and management
- ✅ Portfolio operations (CRUD)
- ✅ Transaction tracking
- ✅ Price integration
- ✅ Calculations and utilities
- ✅ API management
- ✅ Error handling
- ✅ Performance scenarios

**Note:** We use mock-based testing, so traditional code coverage metrics don't apply. Instead, we measure test coverage by the number of test cases and scenarios covered.

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for component interactions
3. Update mocks if new APIs are introduced
4. Ensure tests pass in CI/CD pipeline
5. Maintain or improve test coverage

## Troubleshooting

### Common Issues
- **"portfolio is not defined"** - Ensure tests use global variables properly
- **Mock failures** - Check that mocks are set up in `setup.js`
- **Async test failures** - Use proper async/await patterns
- **Coverage issues** - Ensure all code paths are tested

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- unit-tests.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Portfolio Management"
```