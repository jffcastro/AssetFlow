# AssetFlow - Proposed Features & Improvements

This document outlines potential features, architectural changes, and improvements to elevate the AssetFlow application.

## 1. Technical Architecture & Code Quality

### 🔨 Refactoring to Modules
**Current State:** The application relies heavily on global scripts (`shared.js`) and global scope pollution.
**Proposal:** specific functionality into isolated ES Modules (`import`/`export`).
-   **Benefits:** Better maintainability, easier testing, prevents variable collisions.
-   **Action:** Convert `shared.js` into a `utils/` directory with specific files like `formatter.js`, `calculator.js`, `storage.js`.

### 🛡️ TypeScript Integration
**Current State:** Vanilla JavaScript deals with financial data (floats), which is prone to precision errors and runtime type mismatches.
**Proposal:** adopt TypeScript.
-   **Benefits:** Static typing ensures `price` is always a number, interfaces define transaction structures strictly.
-   **Action:** Set up a build process (Vite) and incrementally migrate `.js` files to `.ts`.

### 🧪 Automated Testing
**Current State:** Manual verification is required for every change.
**Proposal:** Implement Unit and Integration tests.
-   **Benefits:** Confidence in calculations (P&L, weighted averages) when refactoring.
-   **Action:** Add Jest or Vitest. Write tests for `formatCurrency`, `calculateTotalValue`, and `calculateRealizedPnL`.

---

## 2. New User Features

### 📊 Advanced Analytics & Visualizations
**Proposal:** Add a dedicated "Analytics" view.
-   **Allocation Charts:** Interactive Pie/Donut charts showing portfolio diversity by Asset Type, Sector, or Risk Level.
-   **Performance Graph:** Line chart comparing Portfolio Value vs. Invested Amount over time (using `validatedHistory`).
-   **Calendar View:** A visual calendar for Earnings (Stocks) and Events (Crypto).

### 🔔 Smart Price Alerts
**Proposal:** Browser-based notifications for price movements.
-   **Features:** Set targets (e.g., "Notify if BTC > $100k").
-   **Implementation:** Background worker checks prices periodically and sends System Notifications.

### 💰 Dividend & Passive Income Tracker
**Proposal:** Dedicated section for income generating assets.
-   **Features:** Track dividend payouts, staking rewards (Crypto), and calculate "Annual Estimated Income".
-   **Implementation:** Add a `dividend` transaction type and visualization for monthly income.

### 🎮 Enhanced CS2 Integration
**Proposal:** Deepen the Counter-Strike 2 asset tracking (referenced in code).
-   **Features:** Integration with Steam Community Market APIs for real-time skin pricing. 
-   **Float/Pattern Tracking:** specific fields for skin wear and patterns.

---

## 3. Data & Persistence

### ☁️ Cloud Sync (Optional)
**Current State:** Data lives in `localStorage`. If the user clears cache or loses the device, data is lost.
**Proposal:** Add an optional Cloud Sync feature.
-   **Implementation:** Use Firebase or Supabase for a serverless backend.
-   **Privacy:** Encrypt data client-side before syncing to ensure user privacy.

### 📥 Broker Import Wizards
**Proposal:** Simplify data entry.
-   **Features:** Drag-and-drop import for CSV exports from major brokers (e.g., Revolut, Degiro, Interactive Brokers, Coinbase).
-   **Implementation:** Parsers for specific CSV formats to auto-populate the transaction history.

---

## 4. UI/UX Polishing

### 📱 PWA (Progressive Web App) Support
**Proposal:** Make the app installable on mobile devices.
-   **Benefits:** "App-like" experience on iOS/Android, offline access to cached data.
-   **Action:** Add a `manifest.json` and a Service Worker for offline caching.

### 🎨 Customizable Dashboard
**Proposal:** Allow users to choose what they see first.
-   **Features:** Drag-and-drop widgets (e.g., "Top Movers", "Quick Add", "Total Balance").

---

## Roadmap Recommendation

1.  **Phase 1 (Stability):** Unit Tests for math functions + Module Refactor.
2.  **Phase 2 (Visuals):** Chart.js integration for Portfolio Allocation.
3.  **Phase 3 (Features):** Price Alerts and Dividend Tracking.
