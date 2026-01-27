# AssetFlow Test Suite

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run CI mode (no watch)
npm run test:ci
```

## Test Coverage

The test suite covers:

### Unit Tests
- **formatter.test.js** - Currency and number formatting
- **calculator.test.js** - Financial calculations (P&L, holdings, total value)
- **storage.test.js** - localStorage persistence operations
- **state.test.js** - State management module

### Integration Tests
- **workflow.test.js** - Full portfolio workflows combining multiple modules

## Test Structure

```
tests/
├── setup.js              # Test environment setup
├── polyfills.js          # Polyfills for Jest
├── unit/
│   ├── formatter.test.js
│   ├── calculator.test.js
│   ├── storage.test.js
│   └── state.test.js
├── integration/
│   └── workflow.test.js
└── fixtures/
    └── (test data files)
```

## Writing New Tests

### Unit Test Example
```javascript
import { myFunction } from '../js/modules/module';

describe('Module', () => {
    test('does something', () => {
        const result = myFunction(input);
        expect(result).toBe(expected);
    });
});
```

### Integration Test Example
```javascript
import { funcA } from '../js/modules/a';
import { funcB } from '../js/modules/b';

describe('Feature Workflow', () => {
    test('complete workflow', () => {
        funcA();
        const result = funcB();
        expect(result).toBeDefined();
    });
});
```

## CI Integration

Tests run automatically in CI mode with:
- Jest --ci --watchAll=false
- Exit code 1 on failure
- Clean console output
