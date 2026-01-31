# CS2 USD Removal - Complete EUR Migration

## Overview
This document tracks the complete removal of USD display options from the CS2 page, making the app fully EUR-centric for CS2 portfolios while maintaining backward compatibility with USD-stored data from Pricempire API.

## Changes Made

### 1. HTML Changes (`cs2.html`)

#### Removed USD Currency Selection in Add Portfolio Modal
**Before:**
```html
<div class="mb-6">
    <label for="portfolio-currency" class="block text-sm font-medium mb-2">Currency</label>
    <select id="portfolio-currency" class="w-full glass-input...">
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
    </select>
</div>
```

**After:**
```html
<input type="hidden" id="portfolio-currency" value="EUR">
```

#### Removed USD Currency Selection in Pending Funds Modal
**Before:**
```html
<div class="mb-4">
    <label for="funds-currency" class="block text-sm font-medium mb-2">Currency</label>
    <select id="funds-currency" class="w-full glass-input...">
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
    </select>
</div>
```

**After:**
```html
<input type="hidden" id="funds-currency" value="EUR">
```

#### Removed USD Display from Pending Funds Total
**Before:**
```html
<div class="flex items-center justify-between...">
    <div>
        <div class="text-sm text-gray-300 mb-1">Total Pending Funds (USD)</div>
        <div class="text-lg font-semibold text-orange-400" id="total-pending-funds-usd">$0.00</div>
    </div>
    <div>
        <div class="text-sm text-gray-300 mb-1">Total Pending Funds (EUR)</div>
        <div class="text-lg font-semibold text-orange-400" id="total-pending-funds-eur">€0.00</div>
    </div>
</div>
```

**After:**
```html
<div class="flex items-center justify-between...">
    <div>
        <div class="text-sm text-gray-300 mb-1">Total Pending Funds (EUR)</div>
        <div class="text-lg font-semibold text-orange-400" id="total-pending-funds-eur">€0.00</div>
    </div>
</div>
```

#### Updated Portfolio Description
**Before:**
```html
<p class="text-gray-400 text-sm">Manage your CS2 item portfolios. Each portfolio tracks items in USD and
    contributes to your total portfolio value.</p>
```

**After:**
```html
<p class="text-gray-400 text-sm">Manage your CS2 item portfolios. Each portfolio tracks items in EUR and
    contributes to your total portfolio value.</p>
```

### 2. JavaScript Changes (`js/cs2.js`)

#### Updated `renderPendingFunds()` Function
- Removed `total-pending-funds-usd` element reference
- Changed to calculate total in EUR from breakdown items
- Supports legacy USD data with automatic conversion
- Updates `portfolio.cs2.pendingFunds.total` for backward compatibility

**Key Logic:**
```javascript
// Calculate total in EUR (converting from stored currency if needed)
let totalEUR = 0;
Object.values(breakdown).forEach(item => {
    let amount, currency;
    if (typeof item === 'number') {
        // Legacy format: assume USD
        amount = item;
        currency = 'USD';
    } else {
        amount = item.amount || 0;
        currency = item.currency || 'EUR';
    }
    // Convert to EUR if needed
    const amountInEUR = currency === 'USD' ? amount / eurUsdRate : amount;
    totalEUR += amountInEUR;
});
```

#### Updated Individual Pending Funds Item Rendering
- Removed dual currency display (USD and EUR)
- Now shows only EUR for all marketplace funds
- Converts legacy USD values automatically

**Before:**
```javascript
const altAmount = currency === 'USD' ? amount / eurUsdRate : amount * eurUsdRate;
const altCurrency = currency === 'USD' ? 'EUR' : 'USD';
// Display: $100.00 (€85.32)
```

**After:**
```javascript
const amountInEUR = currency === 'USD' ? amount / eurUsdRate : amount;
// Display: €85.32
```

#### Updated `editPendingFunds()` Function
- Removed `document.getElementById('funds-currency').value = currency`
- Currency field is now hidden and defaults to EUR

#### Updated Portfolio Card Display (`createPortfolioElement()`)
- Labels now show "Value (EUR)" and "Realized P&L (EUR)" instead of dynamic currency
- Removed alternative currency display in parentheses
- Values are converted to EUR for display
- Backend storage remains in original currency (USD/EUR) for API compatibility

**Key Changes:**
```javascript
// Convert values to EUR for display
const valueInEUR = currency === 'USD' ? (portfolioData.value || 0) / eurUsdRate : (portfolioData.value || 0);
const realizedPnlInEUR = currency === 'USD' ? (portfolioData.realizedPnl || 0) / eurUsdRate : (portfolioData.realizedPnl || 0);

input.value = valueInEUR.toFixed(2);
realizedPnlInput.value = realizedPnlInEUR.toFixed(2);
current.textContent = formatCurrency(valueInEUR, 'EUR');
realizedPnlDisplay.textContent = formatCurrency(realizedPnlInEUR, 'EUR');
```

#### Updated `savePortfolio()` Function
- Accepts EUR input from user
- Converts back to stored currency (USD/EUR) for data persistence
- Updates transaction notes to show EUR values
- Removes alternative currency display updates

#### Updated `savePortfolioRealizedPnL()` Function
- Accepts EUR input from user
- Converts back to stored currency for data persistence
- Updates display in EUR only

#### **CRITICAL FIX**: Added `saveData()` in `applyPricempireData()`
This was the main bug causing CS2 values not to appear in dashboard totals.

**Before:**
```javascript
renderPortfolios();
updateCombinedTotal();  // Sets portfolio.cs2.value
updateCombinedDisplay();
// Missing saveData()!
```

**After:**
```javascript
renderPortfolios();
updateCombinedTotal();  // Sets portfolio.cs2.value
saveData();  // ✅ Persist the updated value to localStorage
updateCombinedDisplay();
```

## Data Flow Architecture

### Display Layer (User-Facing)
- **All inputs and displays are in EUR**
- User sees EUR values in all fields
- User enters EUR values when editing

### Storage Layer (Backend)
- **Portfolios store values in their original currency** (USD from Pricempire API or EUR from manual entry)
- **Pending funds breakdown stores each marketplace in its original currency**
- This maintains API compatibility and allows re-fetching without data loss

### Conversion Layer
- **Display → Storage**: When user saves, EUR values are converted to stored currency
- **Storage → Display**: When rendering, stored currency values are converted to EUR
- **Calculation**: `updateCombinedTotal()` converts all to EUR for `portfolio.cs2.value`

### Example Flow
```
User enters: €100.00
    ↓
savePortfolio() receives: 100 EUR
    ↓
Stored currency check: portfolio.cs2.portfolios[id].currency = 'USD'
    ↓
Convert to USD: 100 * eurUsdRate = $117.00
    ↓
Save to portfolio: value = 117.00, currency = 'USD'
    ↓
updateCombinedTotal() calculates: 117.00 / eurUsdRate = €100.00
    ↓
portfolio.cs2.value = 100.00, portfolio.cs2.currency = 'EUR'
    ↓
saveData() → localStorage
    ↓
Dashboard reads portfolio.cs2.value = 100.00 EUR ✅
```

## Backward Compatibility

### Legacy USD Data
- Old portfolios with `currency: 'USD'` continue to work
- Values are automatically converted to EUR for display
- User edits are converted back to USD for storage
- No data migration needed

### Pricempire API Integration
- API returns portfolios in USD (or EUR if configured)
- `applyPricempireData()` preserves the API currency
- Display layer shows everything in EUR
- Total calculations work correctly regardless of source currency

### Pending Funds Migration
- Old format: `breakdown: { "marketplace": 123.45 }` (number = USD)
- New format: `breakdown: { "marketplace": { amount: 123.45, currency: 'EUR' } }`
- Code handles both formats automatically

## Benefits

### 1. Simplified User Experience
- No currency confusion - everything shows EUR
- Consistent with rest of app (stocks, ETFs, crypto)
- Cleaner UI without dual displays

### 2. Flexible Backend
- Maintains API compatibility
- Supports mixed currency portfolios internally
- Easy to add new currencies in future

### 3. Correct Calculations
- `portfolio.cs2.value` always accurate
- Dashboard totals include CS2 properly
- Pending funds counted correctly

### 4. Zero Migration Needed
- Existing data works immediately
- No user action required
- Graceful degradation for old formats

## Testing Checklist

- [x] New portfolios default to EUR
- [x] Portfolio values display in EUR
- [x] Realized P&L displays in EUR
- [x] Pending funds display in EUR
- [x] Pricempire API fetch works correctly
- [x] USD portfolios from API display in EUR
- [x] Manual edits save correctly
- [x] `portfolio.cs2.value` updates after API fetch
- [x] Dashboard includes CS2 in total
- [x] No USD selectors visible in UI
- [x] Legacy USD data converts correctly

## Files Modified

1. ✅ `cs2.html` - Removed USD options, updated descriptions
2. ✅ `js/cs2.js` - EUR-only display, conversion logic, saveData() fix

## Related Documentation

- See `CS2_EUR_CONSOLIDATION.md` for the original consolidation work
- See `CS2_EUR_SUPPORT.md` for EUR currency support implementation

## Future Enhancements

### Potential Improvements
1. **Full EUR Migration**: Convert all stored data to EUR (removes conversion layer)
2. **Multi-Currency Support**: Add other currencies if needed
3. **Currency Settings**: Allow user to choose display currency

### Not Recommended
- ❌ Forcing Pricempire data to EUR (breaks API compatibility)
- ❌ Storing display values instead of source values (data integrity issues)

## Migration Path (If Needed)

If you want to fully migrate all data to EUR in the future:

```javascript
// One-time migration function
function migrateAllToEUR() {
    Object.values(portfolio.cs2.portfolios).forEach(p => {
        if (p.currency === 'USD') {
            p.value = p.value / eurUsdRate;
            p.realizedPnl = p.realizedPnl / eurUsdRate;
            p.currency = 'EUR';
        }
    });
    
    Object.entries(portfolio.cs2.pendingFunds.breakdown).forEach(([marketplace, item]) => {
        if (typeof item === 'object' && item.currency === 'USD') {
            item.amount = item.amount / eurUsdRate;
            item.currency = 'EUR';
        }
    });
    
    saveData();
}
```

## Conclusion

The CS2 page is now fully EUR-centric from a user perspective while maintaining flexible backend storage. This provides the best user experience while ensuring compatibility with external APIs and existing data. The critical bug fix (missing `saveData()` after `updateCombinedTotal()`) ensures the dashboard correctly includes CS2 values in total portfolio calculations.

