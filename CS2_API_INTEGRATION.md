# CS2 PricEmpire API Integration

## Overview
The CS2 portfolio page now supports two modes of operation:
1. **Manual Mode** (default): User manually enters all portfolio values
2. **API Mode**: Automatically fetches portfolio data from PricEmpire API

## Features

### Mode Toggle
- Located at the top of the CS2 page
- Checkbox toggle with visual indicator (Manual/API)
- Mode preference persisted in `localStorage` as `cs2ApiMode`
- Automatically fetches data when switching to API mode

### API Mode Functionality

#### Data Fetching
- **Endpoint**: `https://api.pricempire.com/v4/trader/portfolios`
- **Authentication**: Bearer token (stored encrypted via API key configuration page)
- **Auto-fetch**: Triggered on mode switch and page load (if in API mode)
- **Manual refresh**: "Fetch from API" button visible in API mode

#### API Response Mapping
The API returns the following fields per portfolio:
```json
{
  "id": "portfolio-id",
  "name": "Portfolio Name",
  "slug": "portfolio-slug",
  "currency": "USD",
  "value": 123456,              // Cents - divided by 100
  "change24h": 1234,             // Cents - divided by 100
  "change24h_percentage": 2.5,   // Percentage - NOT divided
  "items_count": 42,
  "total_invested": 100000,      // Cents - divided by 100
  "profit_loss": 23456,          // Cents - divided by 100
  "roi": 23.45                   // Percentage - NOT divided
}
```

#### Decimal Adjustment
**Critical**: All monetary values from the API are in cents and must be divided by 100:
- `value` → dollars
- `change24h` → dollars
- `total_invested` → dollars
- `profit_loss` → dollars

**Exception**: Percentages (`change24h_percentage`, `roi`) are already in correct format.

#### Portfolio Structure
```javascript
{
  name: "Portfolio Name",
  description: "42 items",         // Auto-generated from items_count
  color: "blue",                   // Auto-assigned cycling through theme colors
  value: 1234.56,                  // From API (divided by 100)
  realizedPnl: 0,                  // Manually maintained (NOT from API)
  currency: "USD",
  // Additional API fields:
  change24h: 12.34,
  change24h_percentage: 2.5,
  items_count: 42,
  total_invested: 1000.00,
  profit_loss: 234.56,             // Unrealized P&L
  roi: 23.45,
  apiManaged: true                 // Flag indicating API-sourced portfolio
}
```

### UI Behavior

#### Manual Mode
- **Add Portfolio** button visible
- **All fields editable**:
  - Value (USD)
  - Realized P&L (USD)
- **Save button**: "Save [Portfolio Name]"
- **Remove button**: Available for each portfolio

#### API Mode
- **Fetch from API** button visible
- **Add Portfolio** button hidden
- **Readonly fields**:
  - Value (USD) - fetched from API, cannot be edited
- **Editable fields**:
  - Realized P&L (USD) - manual tracking, NOT from API
- **Save button**: "Save Realized P&L"
- **Remove button**: Hidden (portfolios managed by API)
- **Additional displays**:
  - 24h Change (with percentage)
  - Items Count
  - Total Invested
  - Unrealized P&L (from API)
  - ROI

### Data Persistence

#### Mode Preference
```javascript
localStorage.setItem('cs2ApiMode', 'api' | 'manual');
```

#### Portfolio Data
- Stored in `portfolio.cs2.portfolios` object
- Synced with main portfolio object via `saveData()`
- Realized P&L preserved when re-fetching from API
- Additional API fields stored alongside standard fields

#### API Key Storage
- Configured in [configurations.html](configurations.html)
- Stored encrypted: `portfolioPilotPricEmpire`
- Format: `{apiKey: "your-api-key", status: "active"}`

## Implementation Files

### Modified Files
1. **cs2.html**
   - Added mode toggle UI (checkbox with label)
   - Added "Fetch from API" button
   - Conditional display based on mode

2. **js/cs2.js**
   - Added `isApiMode` global variable
   - Added `fetchPricEmpireData()` async function
   - Modified `createPortfolioElement()` to support API mode
   - Added `savePortfolioRealizedPnL()` for API mode saves
   - Added mode toggle event listeners
   - Added API field rendering (24h change, items count, etc.)

3. **configurations.html**
   - Added PricEmpire API key section
   - Save/load functionality for API key

4. **js/configurations.js**
   - Added PricEmpire API key handlers
   - Updated status indicators

## Usage Instructions

### Setup
1. Navigate to Configurations page
2. Scroll to "PricEmpire API Key" section
3. Enter your PricEmpire API key
4. Click "Save PricEmpire Key"
5. Verify status shows "Active"

### Using API Mode
1. Navigate to CS2 page
2. Toggle mode switch to "API"
3. Click "Fetch from API" (or automatic fetch occurs)
4. View fetched portfolios with API data
5. Edit "Realized P&L" as needed
6. Click "Save Realized P&L" to persist manual changes

### Reverting to Manual Mode
1. Toggle mode switch to "Manual"
2. Portfolios revert to manual management
3. All fields become editable
4. Previous manual data preserved (if any)

## Error Handling

### API Key Missing
- Shows notification: "PricEmpire API key not found. Please configure it in settings."
- Does not attempt API call

### API Request Failed
- Catches HTTP errors (401, 403, 500, etc.)
- Shows notification with error status
- Preserves existing portfolio data

### Invalid Response Format
- Validates API response structure
- Checks for `portfolios` array
- Shows error if format unexpected

### Network Errors
- Catches fetch exceptions
- Displays user-friendly error message
- Logs detailed error to console

## Technical Notes

### Color Assignment
Portfolios automatically assigned colors cycling through:
`blue → purple → green → red → yellow → pink → indigo → orange`

### Currency Handling
- All portfolios use USD (from API)
- EUR conversion handled via global `eurUsdRate`
- Displays both USD and EUR for realized P&L

### Realized P&L Preservation
When fetching from API:
```javascript
const existingRealizedPnl = portfolio.cs2.portfolios[id]?.realizedPnl || 0;
newPortfolios[id].realizedPnl = existingRealizedPnl;
```

### Portfolio Identification
- Uses API `slug` as portfolio ID (fallback to `portfolio-{id}`)
- Ensures consistent mapping across API fetches
- Preserves realized P&L across refreshes

## Future Enhancements
- [ ] Auto-refresh timer for API mode
- [ ] Historical data tracking from API
- [ ] Export API data to CSV
- [ ] Sync realized P&L with transaction system
- [ ] Support for multiple API providers
- [ ] Cached API responses with TTL
- [ ] API call rate limiting/throttling
