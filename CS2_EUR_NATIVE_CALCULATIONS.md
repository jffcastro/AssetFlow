# CS2 Native EUR Calculations Fix

## Overview
This document tracks the fix for CS2 calculations across the app. Previously, the app assumed all CS2 portfolio values were in USD and converted them to EUR. Now that the CS2 page works natively in EUR, we need to update all calculation functions to handle mixed currencies properly (EUR from manual portfolios and potentially USD from Pricempire API).

## Problem Statement

### Old Behavior (Incorrect)
When the CS2 page was USD-only:
```javascript
// Dashboard and shared.js assumed ALL portfolios were in USD
const totalUsd = Object.values(portfolio.cs2.portfolios)
    .reduce((sum, p) => sum + (p.value || 0), 0);
cs2Value = totalUsd / eurUsdRate;  // Always converted from USD
```

### Issue
After implementing EUR-native CS2:
- Manual portfolios: Stored in EUR (`currency: 'EUR'`)
- Pricempire API portfolios: Stored in USD (`currency: 'USD'`)
- Old code assumed everything was USD, causing **double conversion** for EUR portfolios
- EUR portfolios were being incorrectly divided by `eurUsdRate`, making values appear smaller

### Example of the Bug
```
User has €100 EUR portfolio
  ↓
Old code: 100 / 1.17 = €85.47  ❌ WRONG (shouldn't convert)
  ↓
Dashboard shows €85.47 instead of €100
```

## Solution

### New Behavior (Correct)
Check each portfolio's currency and convert only if needed:
```javascript
const totalEur = Object.values(portfolio.cs2.portfolios)
    .reduce((sum, p) => {
        const value = p.value || 0;
        const currency = p.currency || 'EUR';
        // Convert to EUR ONLY if portfolio is in USD
        const valueInEur = currency === 'USD' ? value / eurUsdRate : value;
        return sum + valueInEur;
    }, 0);
cs2Value = totalEur;  // Already in EUR
```

## Files Modified

### 1. `js/shared.js` - calculateTotalValue()
**Location:** Line ~1625-1655

**Before:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalUsd = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => sum + (p.value || 0), 0);
    cs2Value = totalUsd / eurUsdRate;  // ❌ Assumed all USD
}
```

**After:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalEur = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => {
            const value = p.value || 0;
            const currency = p.currency || 'EUR';
            // Convert to EUR if portfolio is stored in USD
            const valueInEur = currency === 'USD' ? value / eurUsdRate : value;
            return sum + valueInEur;
        }, 0);
    cs2Value = totalEur;  // ✅ Properly handles mixed currencies
}
```

### 2. `js/dashboard.js` - calculatePortfolioBreakdown()
**Location:** Line ~1188-1230

**Changes:**
1. **Portfolio values:** Same fix as shared.js
2. **Pending funds:** Updated to calculate from breakdown with proper currency handling

**Before:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalEur = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => {
            const value = p.value || 0;
            const currency = p.currency || 'USD';  // ❌ Default was USD
            const valueInEur = currency === 'USD' ? value / eurUsdRate : value;
            return sum + valueInEur;
        }, 0);
    cs2Value = totalEur;

    // ❌ Assumed pending funds total was in USD
    if (portfolio.cs2.pendingFunds && portfolio.cs2.pendingFunds.total) {
        cs2Value += portfolio.cs2.pendingFunds.total / eurUsdRate;
    }
}
```

**After:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalEur = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => {
            const value = p.value || 0;
            const currency = p.currency || 'EUR';  // ✅ Default is now EUR
            const valueInEur = currency === 'USD' ? value / eurUsdRate : value;
            return sum + valueInEur;
        }, 0);
    cs2Value = totalEur;

    // ✅ Calculate from breakdown with proper currency handling
    if (portfolio.cs2.pendingFunds && portfolio.cs2.pendingFunds.breakdown) {
        const pendingFundsEur = Object.values(portfolio.cs2.pendingFunds.breakdown)
            .reduce((sum, item) => {
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
                const amountInEur = currency === 'USD' ? amount / eurUsdRate : amount;
                return sum + amountInEur;
            }, 0);
        cs2Value += pendingFundsEur;
    }
}
```

### 3. `js/modules/calculator.js` - calculateTotalValue()
**Location:** Line ~205-225

**Before:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalUsd = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => sum + (p.value || 0), 0);
    cs2Value = totalUsd / eurUsdRate;  // ❌ Assumed all USD
}
```

**After:**
```javascript
else if (portfolio.cs2.portfolios) {
    const totalEur = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => {
            const value = p.value || 0;
            const currency = p.currency || 'EUR';
            // Convert to EUR if portfolio is stored in USD (for Pricempire API compatibility)
            const valueInEur = currency === 'USD' ? value / eurUsdRate : value;
            return sum + valueInEur;
        }, 0);
    cs2Value = totalEur;  // ✅ Properly handles mixed currencies
}
```

## Logic Flow

### Three-Tier Fallback System
All calculation functions now use this pattern:

```javascript
if (typeof portfolio.cs2.value === 'number' && portfolio.cs2.currency === 'EUR') {
    // 1️⃣ PREFERRED: Use pre-calculated EUR total (includes pending funds)
    cs2Value = portfolio.cs2.value;
}
else if (portfolio.cs2.portfolios) {
    // 2️⃣ DYNAMIC: Calculate from individual portfolios (with currency conversion)
    const totalEur = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => {
            const currency = p.currency || 'EUR';
            const valueInEur = currency === 'USD' ? p.value / eurUsdRate : p.value;
            return sum + valueInEur;
        }, 0);
    cs2Value = totalEur;
    
    // Add pending funds if present
    // (with proper currency handling)
}
else {
    // 3️⃣ LEGACY: Old playItems/investmentItems structure (always USD)
    const totalUsd = (portfolio.cs2.playItems?.value || 0) + 
                     (portfolio.cs2.investmentItems?.value || 0);
    cs2Value = totalUsd / eurUsdRate;
}
```

## Currency Defaults Changed

### Before
```javascript
const currency = p.currency || 'USD';  // ❌ Assumed USD if missing
```

### After
```javascript
const currency = p.currency || 'EUR';  // ✅ Default to EUR (app's native currency)
```

**Rationale:**
- App is EUR-centric
- Manual portfolios created through UI are EUR
- Only Pricempire API portfolios might be USD (and they explicitly set `currency: 'USD'`)
- Safer default for user-created data

## Backward Compatibility

### USD Portfolios (Pricempire API)
✅ **Still supported!**
```javascript
{
  name: "API Portfolio",
  value: 117.00,
  currency: "USD",  // ← API sets this explicitly
  // ... other fields
}
```
- Properly converted to EUR: `117.00 / 1.17 = €100.00`

### EUR Portfolios (Manual)
✅ **Correctly handled!**
```javascript
{
  name: "Manual Portfolio",
  value: 100.00,
  currency: "EUR",  // ← Explicitly set
  // ... other fields
}
```
- No conversion: `€100.00` stays `€100.00`

### Legacy Portfolios (No Currency Field)
✅ **Safe default!**
```javascript
{
  name: "Old Portfolio",
  value: 100.00,
  // currency is missing
}
```
- Defaults to EUR: `€100.00` (no conversion)
- This is correct for user data created through the app

### Legacy Structure
✅ **Still works!**
```javascript
portfolio.cs2 = {
  playItems: { value: 50 },
  investmentItems: { value: 50 }
}
```
- Treated as USD: `100 / eurUsdRate = €85.47`

## Pending Funds Improvements

### Old Approach
```javascript
// Used portfolio.cs2.pendingFunds.total (assumed USD)
cs2Value += portfolio.cs2.pendingFunds.total / eurUsdRate;
```

**Problem:** 
- Didn't account for individual marketplace currencies
- Assumed all pending funds were USD

### New Approach
```javascript
// Calculate from breakdown with currency awareness
const pendingFundsEur = Object.values(portfolio.cs2.pendingFunds.breakdown)
    .reduce((sum, item) => {
        let amount, currency;
        if (typeof item === 'number') {
            // Legacy: number means USD
            amount = item;
            currency = 'USD';
        } else {
            // New: object with amount and currency
            amount = item.amount || 0;
            currency = item.currency || 'EUR';
        }
        const amountInEur = currency === 'USD' ? amount / eurUsdRate : amount;
        return sum + amountInEur;
    }, 0);
cs2Value += pendingFundsEur;
```

**Benefits:**
- ✅ Supports mixed currency pending funds
- ✅ Backward compatible with legacy number format
- ✅ More accurate calculations

## Testing Scenarios

### Scenario 1: Pure EUR Portfolio
```javascript
portfolio.cs2 = {
  value: 100,
  currency: 'EUR',
  portfolios: {
    main: { value: 100, currency: 'EUR' }
  }
}
```
**Expected:** Dashboard shows €100.00 ✅

### Scenario 2: Pure USD Portfolio (Pricempire)
```javascript
portfolio.cs2 = {
  portfolios: {
    pricempire: { value: 117, currency: 'USD' }
  }
}
// Assume eurUsdRate = 1.17
```
**Expected:** Dashboard shows €100.00 (117 / 1.17) ✅

### Scenario 3: Mixed Currencies
```javascript
portfolio.cs2 = {
  portfolios: {
    manual: { value: 100, currency: 'EUR' },
    api: { value: 117, currency: 'USD' }
  }
}
```
**Expected:** Dashboard shows €200.00 (100 + 117/1.17) ✅

### Scenario 4: With Pending Funds
```javascript
portfolio.cs2 = {
  value: 150,
  currency: 'EUR',
  portfolios: {
    main: { value: 100, currency: 'EUR' }
  },
  pendingFunds: {
    breakdown: {
      'Steam': { amount: 50, currency: 'EUR' }
    }
  }
}
```
**Expected:** Dashboard shows €150.00 ✅

## Impact on Dashboard

### Before Fix
- EUR portfolios incorrectly divided by exchange rate
- Values appeared ~15% smaller than actual
- Inconsistent with CS2 page display

### After Fix
- EUR portfolios display correctly
- USD portfolios converted accurately
- Dashboard matches CS2 page totals
- `portfolio.cs2.value` used when available (most efficient)

## Related Files

### Not Modified (Already Correct)
- ✅ `js/modules/calculator.js` - `calculateRealizedPnL()` already handles currency properly
- ✅ `js/cs2.js` - Already updated with EUR-native logic

### Modified
- ✅ `js/shared.js` - Fixed `calculateTotalValue()`
- ✅ `js/dashboard.js` - Fixed `calculatePortfolioBreakdown()`
- ✅ `js/modules/calculator.js` - Fixed `calculateTotalValue()` export

## Summary

This fix ensures that:
1. ✅ **EUR portfolios are not converted** (displayed as-is)
2. ✅ **USD portfolios are properly converted** (divided by exchange rate)
3. ✅ **Default currency is EUR** (safer for user-created data)
4. ✅ **Pending funds handle mixed currencies** (EUR and USD)
5. ✅ **Dashboard totals match CS2 page** (consistency)
6. ✅ **Backward compatibility maintained** (legacy data still works)

The app now correctly handles the transition from USD-only CS2 to EUR-native CS2 while maintaining compatibility with Pricempire API's USD data.

