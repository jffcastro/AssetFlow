# CS2 Currency Support - User Guide

## Overview
The CS2 Items page now supports both **USD** and **EUR** currencies for portfolios and marketplace funds. You can mix currencies freely - the app will automatically handle conversions.

## How to Use

### Creating a Portfolio with EUR
1. Click **"+ Add New Portfolio"**
2. Enter portfolio name (e.g., "Euro Trading")
3. Enter description (optional)
4. Choose a color theme
5. **Select "EUR" from the Currency dropdown** ⬅️ NEW!
6. Click "Add Portfolio"

### Creating a Portfolio with USD
- Same as above, but select "USD" from the Currency dropdown (default)

### Adding Marketplace Funds in EUR
1. Click **"Show Funds"** to expand the Marketplace Funds section
2. Click **"Add Funds"**
3. Enter marketplace name (e.g., "Buff163")
4. **Select "EUR" from the Currency dropdown** ⬅️ NEW!
5. Enter amount in EUR
6. Click "Save"

### Adding Marketplace Funds in USD
- Same as above, but select "USD" from the Currency dropdown (default)

## What You'll See

### Portfolio Display
Each portfolio shows:
- **Value input**: Labeled with the portfolio's currency (e.g., "Value (EUR)")
- **Current Value**: Displayed in the portfolio's native currency
- **Realized P&L**: Shown in native currency with alternative currency in parentheses
  - Example: `€50.00 ($55.00)` for a EUR portfolio
  - Example: `$100.00 (€90.91)` for a USD portfolio

### Marketplace Funds Display
Each marketplace fund shows:
- **Amount**: In the fund's native currency
- **Alternative Currency**: In parentheses
  - Example: `€300.00 ($330.00)` for a EUR fund
  - Example: `$200.00 (€181.82)` for a USD fund

### Combined Totals
The "Total CS2 Portfolio Value" section shows:
- **Total Exposure (USD)**: All portfolios + funds converted to USD
- **Total Exposure (EUR)**: All portfolios + funds converted to EUR
- **Active Items (USD)**: Only portfolio values (excluding pending funds) in USD

## API Integration

### Pricempire API
If you use the API mode (toggle to "API"):
- The app automatically detects the currency from the API response
- EUR portfolios from the API are fully supported
- All API fields (24h change, total invested, unrealized P&L) respect the portfolio's currency

### Switching Between Modes
- **Manual Mode**: You create and manage portfolios manually with your chosen currency
- **API Mode**: Portfolios are fetched from Pricempire API with their currencies

## Currency Conversion

### Exchange Rate
- The app uses the **EUR/USD exchange rate** from the Frankfurter API
- Rates are updated automatically when the app loads
- Conversions happen in real-time based on the current rate

### Conversion Rules
- **USD → EUR**: Amount ÷ Exchange Rate
- **EUR → USD**: Amount × Exchange Rate
- **Example**: If EUR/USD = 1.10
  - $100 USD = €90.91 EUR
  - €100 EUR = $110.00 USD

## Important Notes

### 1. Combined Total Storage
- The app stores the **combined CS2 total in EUR** internally
- This is for consistency with the rest of the portfolio
- You'll see both USD and EUR values in the display

### 2. Pending Funds Total
- The **pending funds total is stored in USD** internally
- Individual funds can be in EUR or USD
- Display shows both currencies for convenience

### 3. Transactions
- When you save a portfolio value, a transaction is created
- Transactions store the currency and exchange rate at the time
- This ensures accurate P&L calculations over time

### 4. Backward Compatibility
- **Existing data is safe!** Old portfolios without currency default to USD
- Old marketplace funds without currency default to USD
- No manual migration needed - it happens automatically

## Examples

### Example 1: Mixed Currency Portfolios
You have:
- "Play Items" portfolio: **$500 USD**
- "Investment Items" portfolio: **€300 EUR**

With EUR/USD rate of 1.10:
- Total in USD: $500 + (€300 × 1.10) = **$830.00**
- Total in EUR: ($500 ÷ 1.10) + €300 = **€754.55**

### Example 2: Mixed Currency Funds
You have marketplace funds:
- Steam Market: **$150 USD**
- Buff163: **€100 EUR**

With EUR/USD rate of 1.10:
- Total pending (USD): $150 + (€100 × 1.10) = **$260.00**
- Total pending (EUR): ($150 ÷ 1.10) + €100 = **€236.36**

### Example 3: Realized P&L Display
You have a EUR portfolio with realized P&L of **€75**:
- Primary display: **€75.00** (in green if positive)
- Alternative display: **($82.50)** (in gray)

## Tips

### When to Use EUR vs USD
- **Use EUR** if you primarily trade on EUR-based marketplaces
- **Use USD** if you primarily trade on USD-based marketplaces or Steam Market
- **Mix both** if you trade on multiple marketplaces with different currencies

### Editing Currency
- You **cannot** change a portfolio's currency after creation
- To change currency: Remove the old portfolio and create a new one
- Values can be copied over manually

### API Mode Considerations
- API-fetched portfolios use the currency returned by Pricempire
- You can still edit the "Realized P&L" field in API mode
- The "Value" field is read-only in API mode

## Troubleshooting

### Currency Not Showing Correctly
- Refresh the page to ensure latest exchange rate is loaded
- Check browser console for any errors
- Clear localStorage and reload (warning: this will reset all data)

### Alternative Currency Wrong
- This might be due to an outdated exchange rate
- The app fetches rates on page load
- Force refresh (Ctrl+F5 or Cmd+Shift+R) to get fresh rates

### Old Data Migration
- Old portfolios automatically default to USD
- Old pending funds automatically default to USD
- This happens on first page load after the update
- No action needed from you

## FAQ

**Q: Can I have some portfolios in USD and others in EUR?**  
A: Yes! You can mix currencies freely.

**Q: Does the currency affect my total portfolio value?**  
A: No, all currencies are converted to EUR for the total portfolio value.

**Q: What happens if the exchange rate changes?**  
A: Display values update automatically based on the current rate.

**Q: Can I change a portfolio's currency after creation?**  
A: No, you need to create a new portfolio with the desired currency.

**Q: Does the API support EUR portfolios?**  
A: Yes, if the Pricempire API returns EUR, it's fully supported.

**Q: What currency should I use for realized P&L?**  
A: Use the same currency as the portfolio for consistency.

## Summary

✅ **Full EUR and USD support** for portfolios and marketplace funds  
✅ **Mix currencies freely** - the app handles all conversions  
✅ **API integration** supports EUR portfolios automatically  
✅ **Backward compatible** - old data works seamlessly  
✅ **Real-time conversion** based on current exchange rates  
✅ **Clear display** shows both currencies for convenience  

Enjoy managing your CS2 items with multi-currency support! 🎮💰

