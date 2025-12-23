// State Management Module
// Holds mutable application state

// --- STATE ---
export let portfolio = {
    stocks: [],
    etfs: [],
    crypto: [],
    static: [],
    cs2: null
};

export let priceCache = { stocks: {}, crypto: {}, etfs: {} };
export let eurUsdRate = 1.0;
export let historicalRates = {}; // Store historical EUR/USD rates by date
export let soldAssetsCache = {}; // Store current prices for sold assets

// --- SETTERS (for use by other modules) ---
export function setPortfolio(newPortfolio) {
    portfolio = newPortfolio;
}

export function setPriceCache(newCache) {
    priceCache = newCache;
}

export function setEurUsdRate(rate) {
    eurUsdRate = rate;
}

export function setHistoricalRates(rates) {
    historicalRates = rates;
}

export function setSoldAssetsCache(cache) {
    soldAssetsCache = cache;
}

// --- GETTERS (for explicit access) ---
export function getPortfolio() {
    return portfolio;
}

export function getPriceCache() {
    return priceCache;
}

export function getEurUsdRate() {
    return eurUsdRate;
}

export function getHistoricalRates() {
    return historicalRates;
}

export function getSoldAssetsCache() {
    return soldAssetsCache;
}
