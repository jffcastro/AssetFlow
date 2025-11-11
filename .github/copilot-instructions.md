# Copilot Instructions for AssetFlow

## Project Overview
AssetFlow is a browser-based portfolio management app for tracking stocks, ETFs, cryptocurrencies, static assets, and CS2 items. It is built with vanilla JavaScript, HTML, and CSS, and uses browser localStorage for persistence. No backend server is required.

## Architecture & Key Patterns
- **Pages:** Each asset type has a dedicated HTML page (e.g., `stocks.html`, `crypto.html`, `etfs.html`, `cs2.html`, `static-assets.html`, `deposits-withdrawals.html`).
- **JavaScript Modules:** Each page is powered by a corresponding JS file in `js/` (e.g., `stocks.js`, `crypto.js`). Shared logic is in `js/shared.js`.
- **Data Flow:** All data is stored and managed in browser localStorage. Data is loaded on page load and saved after user actions.
- **APIs:** Real-time prices are fetched from Yahoo Finance (stocks/ETFs) and CoinGecko (crypto). Exchange rates use Frankfurter. Additional APIs: Finnhub (earnings), CoinMarketCal (crypto events).
- **Charts:** Chart.js is used for all visualizations.
- **Styling:** Tailwind CSS is used for responsive design. Theme switching is handled by `js/theme-switcher.js`.

## Developer Workflows
- **Run Locally:** Open `dashboard.html` (or any page) directly in a browser, or use a static server (e.g., `python -m http.server 8000`).
- **Testing:** Open `tests/test-suite.html` in a browser and click "Run All Tests". Unit and integration tests are in `tests/unit-tests.js` and `tests/integration-tests.js`.
- **No Build Step:** There is no build or bundling process. All JS and CSS are loaded directly.
- **Data Backup/Restore:** Use UI buttons for backup/restore; these trigger download/upload of JSON files.

## Project-Specific Conventions
- **No Frameworks:** Only vanilla JS, HTML, and CSS. No React/Vue/Angular.
- **Single Source of Truth:** All portfolio data is kept in localStorage under well-defined keys (see `js/shared.js`).
- **API Keys:** Optional, configured via UI and stored locally. Never commit API keys.
- **Error Handling:** All user-facing errors should be shown via in-page alerts or modals, not browser alerts.
- **Currency Handling:** Always support multi-currency (EUR, USD, BTC, ETH) and conversions using up-to-date rates.
- **Component Structure:** Each asset type is isolated in its own page/module, but shares common logic via `shared.js`.

## Integration Points
- **APIs:** Yahoo Finance, CoinGecko, Frankfurter, Finnhub, CoinMarketCal. See `js/shared.js` for fetch logic.
- **Charts:** All charting is done with Chart.js, initialized per page.
- **Theme:** Theme switching is handled globally via `js/theme-switcher.js` and CSS files in `css/`.

## Examples
- To add a new asset type, create a new HTML page and a corresponding JS module, following the pattern in `stocks.html`/`stocks.js`.
- To add a new API integration, extend fetch logic in `js/shared.js` and update relevant modules.
- To add a new chart, use Chart.js and follow the setup in `dashboard.js` or `crypto.js`.

## Key Files
- `js/shared.js`: Core utilities, data storage, API fetch logic
- `js/theme-switcher.js`: Theme management
- `tests/`: Test suite and documentation
- `dashboard.html`: Main entry point

---

If you are unsure about a workflow or convention, check the README or look for examples in the relevant JS/HTML files.
