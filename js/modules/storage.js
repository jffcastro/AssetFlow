// Storage Module
// Functions for data persistence (localStorage)

// Note: This module does NOT import state.js to avoid circular dependencies.
// Functions that need state will receive it as parameters or return values
// for the caller to apply to state.

// --- DATA PERSISTENCE ---

/**
 * Loads portfolio data from localStorage.
 * @returns {object|null} Parsed portfolio or null
 */
export function loadPortfolioData() {
    try {
        const data = localStorage.getItem('portfolioPilotData');
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading portfolio data:', e);
    }
    return null;
}

/**
 * Saves portfolio data to localStorage.
 * @param {object} portfolioData - The portfolio to save
 */
export function savePortfolioData(portfolioData) {
    try {
        localStorage.setItem('portfolioPilotData', JSON.stringify(portfolioData));
    } catch (e) {
        console.error('Error saving portfolio data:', e);
    }
}

// --- EXCHANGE RATE ---

/**
 * Loads exchange rate from localStorage.
 * @returns {number} The exchange rate or default 1.0
 */
export function loadExchangeRateFromStorage() {
    const stored = localStorage.getItem('eurUsdRate');
    if (stored) {
        const rate = parseFloat(stored);
        if (!isNaN(rate) && rate > 0) {
            return rate;
        }
    }
    return 1.0;
}

/**
 * Saves exchange rate to localStorage.
 * @param {number} rate - The exchange rate to save
 */
export function saveExchangeRateToStorage(rate) {
    localStorage.setItem('eurUsdRate', rate.toString());
}

// --- HISTORICAL EXCHANGE RATES ---

/**
 * Loads historical rates from localStorage.
 * @returns {object} Historical rates object
 */
export function loadHistoricalRatesFromStorage() {
    try {
        const data = localStorage.getItem('historicalRates');
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading historical rates:', e);
    }
    return {};
}

/**
 * Saves historical rates to localStorage.
 * @param {object} rates - Historical rates to save
 */
export function saveHistoricalRatesToStorage(rates) {
    try {
        localStorage.setItem('historicalRates', JSON.stringify(rates));
    } catch (e) {
        console.error('Error saving historical rates:', e);
    }
}

// --- SOLD ASSETS CACHE ---

/**
 * Loads sold assets cache from localStorage.
 * @returns {object} Sold assets cache
 */
export function loadSoldAssetsCacheFromStorage() {
    try {
        const data = localStorage.getItem('soldAssetsCache');
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading sold assets cache:', e);
    }
    return {};
}

/**
 * Saves sold assets cache to localStorage.
 * @param {object} cache - Cache to save
 */
export function saveSoldAssetsCacheToStorage(cache) {
    try {
        localStorage.setItem('soldAssetsCache', JSON.stringify(cache));
    } catch (e) {
        console.error('Error saving sold assets cache:', e);
    }
}

// --- PRICE CACHE ---

/**
 * Loads price cache from localStorage.
 * @returns {object} Price cache
 */
export function loadPriceCacheFromStorage() {
    try {
        const data = localStorage.getItem('portfolioPilotPriceCache');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed) {
                return {
                    stocks: parsed.stocks || {},
                    crypto: parsed.crypto || {},
                    etfs: parsed.etfs || {}
                };
            }
        }
    } catch (e) {
        console.error('Error loading price cache:', e);
    }
    return { stocks: {}, crypto: {}, etfs: {} };
}

/**
 * Saves price cache to localStorage.
 * @param {object} cache - Cache to save
 */
export function savePriceCacheToStorage(cache) {
    try {
        localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(cache));
    } catch (e) {
        console.error('Error saving price cache:', e);
    }
}

// --- TRANSACTIONS ---

/**
 * Loads transactions from localStorage.
 * @returns {Array} Array of transactions
 */
export function loadTransactions() {
    try {
        const data = localStorage.getItem('portfolioPilotTransactions');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading transactions:', e);
        return [];
    }
}

/**
 * Saves transactions to localStorage.
 * @param {Array} transactions - Array of transactions to save
 */
export function saveTransactions(transactions) {
    try {
        localStorage.setItem('portfolioPilotTransactions', JSON.stringify(transactions));
    } catch (e) {
        console.error('Error saving transactions:', e);
    }
}

/**
 * Adds a single transaction.
 * @param {object} transaction - The transaction to add
 */
export function addTransaction(transaction) {
    try {
        const transactions = loadTransactions();
        transactions.push(transaction);
        saveTransactions(transactions);
    } catch (e) {
        console.error('Error adding transaction:', e);
    }
}

// --- DEPOSIT TRANSACTIONS ---

/**
 * Loads deposit/withdrawal transactions.
 * @returns {Array} Array of deposit transactions
 */
export function loadDepositTransactions() {
    try {
        const data = localStorage.getItem('portfolioPilotDeposits');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading deposit transactions:', e);
        return [];
    }
}

/**
 * Saves deposit/withdrawal transactions.
 * @param {Array} transactions - Transactions to save
 */
export function saveDepositTransactions(transactions) {
    try {
        localStorage.setItem('portfolioPilotDeposits', JSON.stringify(transactions));
    } catch (e) {
        console.error('Error saving deposit transactions:', e);
    }
}

// --- VALIDATED HISTORY ---

/**
 * Loads validated history.
 * @returns {Array} History entries
 */
export function loadValidatedHistory() {
    try {
        const data = localStorage.getItem('portfolioPilotValidatedHistory');
        if (data) return JSON.parse(data);
    } catch { }
    return [];
}

/**
 * Saves validated history.
 * @param {Array} history - History entries to save
 */
export function saveValidatedHistory(history) {
    localStorage.setItem('portfolioPilotValidatedHistory', JSON.stringify(history));
}

// --- CRYPTO RATES CACHE ---

/**
 * Gets cached crypto rates (BTC, ETH).
 * @returns {object|null} Crypto rates or null
 */
export function getCachedCryptoRates() {
    try {
        const data = localStorage.getItem('portfolioPilotCryptoRates');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < 1000 * 60 * 60) {
                return parsed;
            }
        }
    } catch { }
    return null;
}

/**
 * Sets cached crypto rates.
 * @param {number} btc - BTC price in EUR
 * @param {number} eth - ETH price in EUR
 */
export function setCachedCryptoRates(btc, eth) {
    const data = { btc, eth, timestamp: Date.now() };
    localStorage.setItem('portfolioPilotCryptoRates', JSON.stringify(data));
}
