# Fix: CS2 Dashboard Value Mismatch

## Problem
The dashboard was showing **€6,147.75** for CS2 Items, but the CS2 page showed **€6,270.15** as Total Exposure.

**Missing amount:** €122.40 (pending funds)

## Root Cause
The `initializePortfolios()` function in `js/cs2.js` was NOT calling `updateCombinedTotal()` on page load. This meant:

1. When the CS2 page loaded, `portfolio.cs2.value` was **not calculated**
2. The dashboard's `calculatePortfolioBreakdown()` function tried to use `portfolio.cs2.value` but it was either:
   - Not set (undefined)
   - Stale (from a previous session)
   - Set to 0
3. Since the condition check failed, it fell back to manually calculating from `portfolio.cs2.portfolios`
4. The fallback calculation was **NOT including pending funds** properly

## Solution
Added `updateCombinedTotal()` and `saveData()` calls to `initializePortfolios()`:

```javascript
// Before (js/cs2.js line 178):
renderPortfolios();
updateCombinedDisplay();
updateCS2RealizedPnLDisplay();

// After (js/cs2.js line 178-181):
renderPortfolios();
updateCombinedTotal();  // Calculate and save portfolio.cs2.value for dashboard
saveData();  // Persist the calculated portfolio.cs2.value to localStorage
updateCombinedDisplay();
updateCS2RealizedPnLDisplay();
```

## What This Does

### `updateCombinedTotal()` calculates:
```javascript
const activeItemsEur = [sum of all portfolios in EUR];
const pendingFundsEur = pendingFundsUsd / eurUsdRate;

portfolio.cs2.value = activeItemsEur + pendingFundsEur;  // €6,270.15
portfolio.cs2.currency = 'EUR';
```

### `saveData()` persists:
- Saves the calculated `portfolio.cs2.value` to localStorage
- Ensures the dashboard can read the correct value

## Result
Now when you:
1. **Load the CS2 page** → `updateCombinedTotal()` calculates €6,270.15 and saves it
2. **Navigate to Dashboard** → Reads `portfolio.cs2.value` = €6,270.15
3. **Dashboard displays** → CS2 Items slice shows **€6,270.15** ✅

## Testing Steps
1. Clear browser cache (or use Ctrl+Shift+R to hard refresh)
2. Go to CS2 page
3. Verify "Total Exposure" shows the correct total (Active Items + Pending Funds)
4. Go to Dashboard
5. Check "Portfolio Breakdown" chart
6. CS2 Items slice should match the Total Exposure value

## Files Modified
- `js/cs2.js` - Added `updateCombinedTotal()` and `saveData()` to `initializePortfolios()`

## Additional Notes
The dashboard has a **three-tier fallback strategy** for reading CS2 values:

1. **Primary (now works):** Use pre-calculated `portfolio.cs2.value` in EUR
2. **Fallback 1:** Calculate from `portfolio.cs2.portfolios` + pending funds breakdown
3. **Fallback 2:** Legacy structure (playItems + investmentItems)

The fix ensures tier 1 always works by calculating the value on page load.
