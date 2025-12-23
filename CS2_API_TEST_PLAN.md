# CS2 API Integration Test Plan

## Pre-requisites
- [ ] Local server running on port 8000
- [ ] Valid PricEmpire API key
- [ ] Browser DevTools open (for console monitoring)

## Test Scenarios

### 1. Initial State (First Time User)
**Steps:**
1. Open `http://localhost:8000/cs2.html`
2. Verify default portfolios exist (Play Items, Investment Items)
3. Verify mode toggle shows "Manual"
4. Verify "Add Portfolio" button is visible
5. Verify "Fetch from API" button is hidden

**Expected Results:**
- Default portfolios render correctly
- Manual mode active by default
- No console errors

### 2. API Key Configuration
**Steps:**
1. Navigate to Configurations page
2. Scroll to "PricEmpire API Key" section
3. Enter test API key (or use provided key)
4. Click "Save PricEmpire Key"
5. Verify status indicator

**Expected Results:**
- Success notification appears
- Status shows "Active" (green indicator)
- Key saved in localStorage (encrypted)

### 3. Switch to API Mode (Without API Key)
**Steps:**
1. Return to CS2 page
2. Toggle mode switch to API
3. Observe notification

**Expected Results:**
- Error notification: "PricEmpire API key not found..."
- No API call attempted
- Portfolios remain unchanged

### 4. Switch to API Mode (With Valid API Key)
**Steps:**
1. Configure valid API key (see Test 2)
2. Return to CS2 page
3. Toggle mode switch to API
4. Wait for API response

**Expected Results:**
- Info notification: "Fetching data from PricEmpire..."
- API call visible in Network tab
- Success notification: "Successfully fetched X portfolio(s)..."
- Portfolios replaced with API data
- Additional fields visible (24h change, items count, etc.)
- Value field is readonly (darker background)
- Realized P&L field still editable
- Save button text: "Save Realized P&L"
- Remove buttons hidden
- Add Portfolio button hidden

### 5. Verify API Data Rendering
**Steps:**
1. In API mode, inspect each portfolio card
2. Verify all API fields displayed correctly

**Expected Displays:**
- Portfolio name (from API)
- Description showing items count
- 24h Change (with USD amount and percentage)
- Items Count
- Total Invested
- Unrealized P&L (profit_loss from API)
- ROI percentage
- Value (USD) - readonly
- Realized P&L (USD) - editable
- Current value display
- Realized P&L display (USD and EUR)

### 6. Edit Realized P&L in API Mode
**Steps:**
1. In API mode with fetched portfolios
2. Click on Realized P&L input
3. Enter a value (e.g., 500)
4. Click "Save Realized P&L" button

**Expected Results:**
- Success notification: "[Portfolio Name] Realized P&L saved successfully!"
- Realized P&L display updates
- EUR conversion updates
- Data persisted to localStorage

### 7. Re-fetch from API
**Steps:**
1. In API mode with saved Realized P&L
2. Click "Fetch from API" button
3. Wait for response

**Expected Results:**
- Fresh data fetched from API
- Value field updated to latest API value
- **Realized P&L preserved** (not overwritten)
- Additional fields updated
- Success notification

### 8. Switch Back to Manual Mode
**Steps:**
1. In API mode with API portfolios
2. Toggle mode switch to "Manual"
3. Observe UI changes

**Expected Results:**
- Mode text changes to "Manual"
- Add Portfolio button appears
- Fetch from API button hides
- Portfolios re-render in manual mode
- Value field becomes editable (lighter background)
- Save button text: "Save [Portfolio Name]"
- Remove buttons appear (if more than 1 portfolio)

### 9. Mode Persistence
**Steps:**
1. Switch to API mode
2. Refresh page (F5 or Ctrl+R)
3. Observe initial state

**Expected Results:**
- Page loads in API mode (toggle checked)
- Automatically fetches data from API
- Same behavior as manual API fetch

### 10. Error Handling - Invalid API Key
**Steps:**
1. Configure invalid/expired API key
2. Switch to API mode
3. Observe error

**Expected Results:**
- Error notification with HTTP status (e.g., "API request failed: 401 Unauthorized")
- Console shows detailed error
- Existing portfolios preserved

### 11. Error Handling - Network Failure
**Steps:**
1. Open DevTools Network tab
2. Set throttling to "Offline"
3. Click "Fetch from API"

**Expected Results:**
- Error notification: "Failed to fetch data: [error message]"
- Console shows fetch error
- Existing portfolios unchanged

### 12. Decimal Adjustment Verification
**Steps:**
1. In API mode, check browser console
2. Compare API response values to displayed values
3. Verify division by 100 applied

**Example API Response:**
```json
{
  "value": 123456,  // Should display as $1,234.56
  "change24h": -234, // Should display as -$2.34
  "total_invested": 100000 // Should display as $1,000.00
}
```

**Expected Console Output:**
```javascript
// Log the raw API response
{value: 123456, ...}

// Log the mapped portfolio
{value: 1234.56, ...}
```

### 13. Multiple Portfolios
**Steps:**
1. Use API account with 3+ portfolios
2. Fetch from API
3. Verify all portfolios rendered

**Expected Results:**
- All portfolios from API displayed
- Each assigned unique color (cycling)
- Each has independent Realized P&L
- Total CS2 value updates correctly

### 14. Color Assignment
**Steps:**
1. Fetch portfolios from API
2. Note color assignments

**Expected Pattern:**
- 1st portfolio: Blue
- 2nd portfolio: Purple
- 3rd portfolio: Green
- 4th portfolio: Red
- 5th portfolio: Yellow
- 6th portfolio: Pink
- 7th portfolio: Indigo
- 8th portfolio: Orange
- 9th portfolio: Blue (cycle repeats)

### 15. Currency Conversion
**Steps:**
1. In API mode with portfolio value
2. Check "Current Value" display
3. Check Realized P&L EUR display

**Expected Results:**
- Current Value shows USD (from API)
- Realized P&L shows USD
- Realized P&L EUR in parentheses (€X.XX)
- EUR value calculated using `eurUsdRate`

## Console Checks

### Expected Console Logs (Success)
```
Fetching data from PricEmpire...
[API Response logged]
Successfully fetched 3 portfolio(s) from PricEmpire
```

### Expected Console Errors (Failures)
```
Error fetching PricEmpire data: <error details>
```

## Browser DevTools Verification

### Network Tab (API Mode Fetch)
- **Request URL**: `https://api.pricempire.com/v4/trader/portfolios`
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer [API_KEY]`
  - `Content-Type: application/json`
- **Response**: JSON array of portfolios

### Application Tab (localStorage)
- `cs2ApiMode`: "api" or "manual"
- `portfolioPilotPricEmpire`: Encrypted API key object
- `portfolioPilotData`: Contains `cs2.portfolios` with API data

## Edge Cases

### 16. Empty API Response
**Scenario:** API returns empty portfolios array

**Expected:** 
- Success notification: "Successfully fetched 0 portfolio(s)..."
- All portfolios cleared
- Message: "No portfolios found"

### 17. API Returns One Portfolio
**Scenario:** API returns single portfolio

**Expected:**
- Displays correctly
- Cannot remove (would violate "at least one portfolio" rule in manual mode)

### 18. Rapid Mode Switching
**Steps:**
1. Toggle Manual → API → Manual → API quickly
2. Observe behavior

**Expected:**
- Mode updates correctly
- Last mode persists
- No duplicate API calls
- No race conditions

### 19. Long Portfolio Names
**Scenario:** API returns portfolio with 50+ character name

**Expected:**
- Name displays without overflow
- UI remains intact
- Responsive layout maintained

### 20. Negative Values
**Scenario:** API returns negative values for change24h, profit_loss

**Expected:**
- Displays in red
- Minus sign visible
- Formatting correct (e.g., "-$123.45")

## Performance Checks

### 21. API Response Time
**Monitor:**
- Network tab timing
- Time from button click to UI update

**Acceptable:** < 3 seconds for typical response

### 22. UI Responsiveness
**Test:**
- Switch modes 10 times rapidly
- Edit/save Realized P&L 5 times

**Expected:**
- No lag or freezing
- Smooth transitions

## Regression Testing

### 23. Manual Mode Still Works
**After API integration, verify:**
- Can add portfolios manually
- Can edit portfolio values
- Can remove portfolios
- Save functionality works
- Transactions still created (if applicable)

### 24. Other Pages Unaffected
**Verify:**
- Stocks, ETFs, Crypto pages load correctly
- Dashboard aggregates CS2 data correctly
- Deposits/Withdrawals page functional
- Configurations page functional

## Final Acceptance Criteria

- [ ] API integration works with valid key
- [ ] Manual mode preserved and functional
- [ ] Mode toggle works correctly
- [ ] Mode preference persisted
- [ ] Realized P&L editable in both modes
- [ ] Realized P&L preserved across API fetches
- [ ] All API fields displayed correctly
- [ ] Decimal adjustment applied correctly
- [ ] Error handling graceful
- [ ] No console errors in normal operation
- [ ] No regression in existing functionality
- [ ] Documentation complete
- [ ] Code passes linter (if applicable)
