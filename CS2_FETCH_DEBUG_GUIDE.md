# CS2 API Fetch Debug Guide

## Issue Description
When clicking "Fetch from API" on the CS2 page in a browser with existing data, old portfolios persist even though the API returns new data. However, in private/incognito mode (clean localStorage), the new portfolios appear correctly.

## Changes Made

### 1. Enhanced Cache Clearing
- When clicking "Fetch from API" (force=true), the Pricempire cache is now **explicitly cleared** before fetching
- This ensures no stale cached data can interfere with the fresh API call

### 2. Comprehensive Logging
Added detailed console logs throughout the fetch process:
- Raw API response data
- Current portfolios before replacement
- New portfolios after replacement
- Full CS2 object structure
- Verification of saved data in localStorage
- UI update confirmation

### 3. Debug Tools
Added `window.debugCS2` object with helper functions accessible from browser console:

```javascript
// Available commands:
debugCS2.showPortfolios()  // Show current portfolios in memory
debugCS2.showSaved()       // Show portfolios in localStorage
debugCS2.showCache()       // Show Pricempire API cache
debugCS2.clearCache()      // Clear Pricempire cache
debugCS2.reload()          // Reload from localStorage
debugCS2.compare()         // Compare memory vs localStorage
```

## How to Diagnose the Issue

### Step 1: Open Browser Console
1. Open CS2 page
2. Press F12 to open DevTools
3. Go to Console tab

### Step 2: Check Initial State
```javascript
// See what's currently loaded
debugCS2.showPortfolios()

// See what's saved
debugCS2.showSaved()

// Check if they match
debugCS2.compare()
```

### Step 3: Click "Fetch from API"
Watch the console output for:
1. ✅ "Cleared Pricempire cache (forced refresh)"
2. ✅ "Raw API response received: [...]"
3. ✅ "Applying Pricempire data: X portfolio(s)"
4. ✅ "Current portfolios before replacement: [...]"
5. ✅ "New portfolios after replacement: [...]"
6. ✅ "Portfolio data saved to localStorage"
7. ✅ "Verified saved CS2 portfolios: [...]"
8. ✅ "Apply complete - UI updated"

### Step 4: Verify Data Persistence
```javascript
// Immediately after fetch, check if data matches
debugCS2.compare()

// Should show:
// In Memory: ['portfolio1', 'portfolio2']
// In localStorage: ['portfolio1', 'portfolio2']
// Match: ✅
```

### Step 5: Network Tab Analysis
1. Go to Network tab in DevTools
2. Filter by "pricempire" or "corsproxy"
3. Click "Fetch from API"
4. Verify you see a new request (not from cache)
5. Click the request → Preview → Check the response data
6. Compare the API response with what's displayed on screen

## Possible Root Causes

### 1. **Browser Extension Interference**
Some extensions (ad blockers, privacy tools) might interfere with localStorage writes.

**Test:** Try in private mode with extensions disabled.

### 2. **CORS Proxy Caching**
The `corsproxy.io` service might be caching responses server-side.

**Test:** 
```javascript
// Check the raw response in Network tab
// Look for cache headers (X-Cache, Age, etc.)
```

**Workaround:** Add a cache-busting parameter:
```javascript
// In cs2.js, modify the fetch URL:
const timestamp = Date.now();
const fetchUrl = CORS_PROXY ? 
    CORS_PROXY + encodeURIComponent(apiUrl + '?t=' + timestamp) : 
    apiUrl;
```

### 3. **Pricempire API Not Updated**
The portfolios might not be updated on Pricempire's side yet.

**Test:** 
- Check the API response directly in Network tab
- Compare timestamps
- Verify the portfolio data in the raw JSON

### 4. **Race Condition**
Unlikely but possible: `saveData()` completes but then `loadData()` is called by another process.

**Test:**
```javascript
// After clicking fetch, immediately check:
debugCS2.compare()
// If they don't match, there's a race condition
```

### 5. **localStorage Quota Exceeded**
If localStorage is full, writes fail silently.

**Test:**
```javascript
// Check localStorage size
let total = 0;
for (let key in localStorage) {
    total += localStorage[key].length;
}
console.log('localStorage usage:', (total / 1024 / 1024).toFixed(2), 'MB');
// Most browsers allow ~5-10MB
```

## Quick Fixes to Try

### Fix 1: Hard Refresh
```javascript
debugCS2.clearCache()
location.reload()
// Then click "Fetch from API"
```

### Fix 2: Clear All CS2 Data
```javascript
localStorage.removeItem('portfolioPilotData')
localStorage.removeItem('portfolioPilotPricempireCache')
location.reload()
// Then click "Fetch from API"
```

### Fix 3: Manual Data Inspection
```javascript
// Get the raw API response from Network tab (copy as cURL)
// Then in console:
fetch('YOUR_API_URL', {headers: {...}})
    .then(r => r.json())
    .then(data => console.log('Direct API response:', data))
```

## Expected Behavior

### When Clicking "Fetch from API":
1. ❌ **Does NOT** use Pricempire cache
2. ✅ **Does** clear the cache first
3. ✅ **Does** make fresh API call
4. ✅ **Does** completely replace `portfolio.cs2.portfolios`
5. ✅ **Does** save to localStorage immediately
6. ✅ **Does** re-render UI

### Cache is Only Used When:
- Page loads in API mode automatically
- Cache is less than 1 hour old
- User hasn't clicked "Fetch from API"

## Reporting Results

When reporting the issue, please provide:

1. **Console logs** from a full fetch cycle
2. **debugCS2.compare()** output before and after fetch
3. **Network tab** screenshot showing the API request/response
4. **Browser & version** being used
5. **Any errors** in console (red text)

## Next Steps if Issue Persists

If the issue continues after these debugging steps:

1. Add cache-busting to CORS proxy URL
2. Consider switching CORS proxy (try `https://api.allorigins.win/raw?url=`)
3. Check if running on localhost vs GitHub Pages makes a difference
4. Test with API mode disabled (manual portfolio management)

