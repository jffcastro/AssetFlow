// Shared functionality for Portfolio Dashboard
// This file contains common functions used across all pages

// --- STATE MANAGEMENT ---
let portfolio = {
    stocks: [],
    etfs: [],
    crypto: [],
    static: [], // Each static asset: { id, name, type, values: [{date, value, currency}] }
    cs2: { 
        portfolios: {}, 
        value: 0, 
        currency: 'EUR',
        pendingFunds: {
            total: 0,
            breakdown: {}
        }
    }
};

let eurUsdRate = 1.0;
let priceCache = { stocks: {}, crypto: {}, etfs: {} };
let historicalRates = {}; // Store historical EUR/USD rates by date
let soldAssetsCache = {}; // Store current prices for sold assets

// Using full cryptocurrency names directly for CoinGecko API

// --- DATA PERSISTENCE ---
function loadData() {
    try {
        const data = localStorage.getItem('portfolioPilotData');
        if (data) {
            const parsed = JSON.parse(data);
            portfolio = { ...portfolio, ...parsed };
        }
        loadHistoricalRates();
        loadSoldAssetsCache();
    } catch (e) {
        console.error('Error loading portfolio data:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('portfolioPilotData', JSON.stringify(portfolio));
    } catch (e) {
        console.error('Error saving portfolio data:', e);
    }
}

function loadExchangeRate() {
    const stored = localStorage.getItem('eurUsdRate');
    console.log('Loading exchange rate. Stored value:', stored);
    if (stored) {
        // Try to parse as number first (for unencrypted data)
        let rate = parseFloat(stored);
        if (isNaN(rate)) {
            // If parsing fails, try to decrypt the data
            try {
                const decrypted = decryptData(stored);
                rate = parseFloat(decrypted);
                console.log('Decrypted exchange rate:', decrypted, 'Parsed rate:', rate);
            } catch (e) {
                console.error('Failed to decrypt exchange rate:', e);
                rate = NaN;
            }
        }
        
        if (!isNaN(rate) && rate > 0) {
            eurUsdRate = rate;
            console.log('Loaded eurUsdRate from storage:', eurUsdRate);
        } else {
            console.log('Invalid stored rate, using default:', eurUsdRate);
            eurUsdRate = 1.0;
            // Try to fetch the current exchange rate
            fetchExchangeRate();
        }
    } else {
        // Ensure default rate is set when no stored value
        eurUsdRate = 1.0;
        console.log('No stored rate, using default:', eurUsdRate);
        // Try to fetch the current exchange rate
        fetchExchangeRate();
    }
    updateExchangeRateLabel();
}

function saveExchangeRate(rate) {
    console.log('Saving exchange rate:', rate);
    eurUsdRate = rate;
    localStorage.setItem('eurUsdRate', rate);
    console.log('Saved eurUsdRate to storage:', eurUsdRate);
    updateExchangeRateLabel();
}

// --- HISTORICAL EXCHANGE RATES ---
function loadHistoricalRates() {
    try {
        const data = localStorage.getItem('historicalRates');
        if (data) {
            historicalRates = JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading historical rates:', e);
        historicalRates = {};
    }
}

function saveHistoricalRates() {
    try {
        localStorage.setItem('historicalRates', JSON.stringify(historicalRates));
    } catch (e) {
        console.error('Error saving historical rates:', e);
    }
}

async function fetchHistoricalExchangeRate(date) {
    try {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check if we already have this rate
        if (historicalRates[dateStr]) {
            return historicalRates[dateStr];
        }
        
        console.log(`Fetching historical EUR/USD rate for ${dateStr}...`);
        
        // Use Frankfurter API for historical rates
        const response = await fetch(`https://api.frankfurter.app/${dateStr}?from=EUR&to=USD`);
        const data = await response.json();
        
        if (data && data.rates && data.rates.USD) {
            const rate = data.rates.USD;
            historicalRates[dateStr] = rate;
            saveHistoricalRates();
            console.log(`Historical rate for ${dateStr}: ${rate}`);
            return rate;
        } else {
            console.warn(`No historical rate found for ${dateStr}, using current rate`);
            return eurUsdRate;
        }
    } catch (error) {
        console.error(`Error fetching historical rate for ${date}:`, error);
        return eurUsdRate; // Fallback to current rate
    }
}

function getHistoricalRateForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return historicalRates[dateStr] || eurUsdRate;
}

// --- SOLD ASSETS CACHE ---
function loadSoldAssetsCache() {
    try {
        const data = localStorage.getItem('soldAssetsCache');
        if (data) {
            soldAssetsCache = JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading sold assets cache:', e);
        soldAssetsCache = {};
    }
}

function saveSoldAssetsCache() {
    try {
        localStorage.setItem('soldAssetsCache', JSON.stringify(soldAssetsCache));
    } catch (e) {
        console.error('Error saving sold assets cache:', e);
    }
}

// --- REALIZED P&L CALCULATIONS ---
function calculateRealizedPnL(transactions) {
    const realizedPnL = {
        stocks: 0,
        etfs: 0,
        crypto: 0,
        cs2: 0,
        total: 0,
        byAsset: {}
    };
    
    // Group transactions by asset type and symbol
    const assetGroups = {};
    
    transactions.forEach(tx => {
        if (tx.assetType === 'stocks' || tx.assetType === 'etfs' || tx.assetType === 'crypto') {
            const key = `${tx.assetType}_${tx.symbol}`;
            if (!assetGroups[key]) {
                assetGroups[key] = {
                    assetType: tx.assetType,
                    symbol: tx.symbol,
                    buys: [],
                    sells: []
                };
            }
            
            if (tx.type === 'buy') {
                assetGroups[key].buys.push(tx);
            } else if (tx.type === 'sell') {
                assetGroups[key].sells.push(tx);
            }
        }
        // CS2 transactions are not used for realized P&L calculation
        // CS2 realized P&L is only calculated from manual input in portfolios
    });
    
    // Calculate realized P&L for each asset
    Object.values(assetGroups).forEach(asset => {
        let remainingBuys = [...asset.buys];
        let assetRealizedPnL = 0;
        
        // Sort buys by date (FIFO)
        remainingBuys.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        asset.sells.forEach((sell, sellIndex) => {
            let sellQuantity = sell.quantity;
            
            // Use original USD values if available to avoid currency fluctuation effects
            let sellTotalUSD = sell.originalPrice ? sell.originalPrice * sell.quantity : sell.total * eurUsdRate;
            let sellTotalEUR = sellTotalUSD / (sell.historicalRate || eurUsdRate);
            
            while (sellQuantity > 0 && remainingBuys.length > 0) {
                const buy = remainingBuys[0];
                const buyQuantity = buy.quantity;
                
                // Use original USD values if available to avoid currency fluctuation effects
                let buyTotalUSD = buy.originalPrice ? buy.originalPrice * buy.quantity : buy.total * eurUsdRate;
                let buyTotalEUR = buyTotalUSD / (buy.historicalRate || eurUsdRate);
                
                if (buyQuantity <= sellQuantity) {
                    // This buy is completely sold
                    const sellPortionUSD = sellTotalUSD * (buyQuantity / sell.quantity);
                    const sellPortionEUR = sellPortionUSD / (sell.historicalRate || eurUsdRate);
                    const realizedGain = sellPortionEUR - buyTotalEUR;
                    
                    realizedPnL[asset.assetType] += realizedGain;
                    assetRealizedPnL += realizedGain;
                    
                    sellQuantity -= buyQuantity;
                    remainingBuys.shift();
                } else {
                    // Partial sell of this buy
                    const sellPortionUSD = sellTotalUSD * (sellQuantity / sell.quantity);
                    const sellPortionEUR = sellPortionUSD / (sell.historicalRate || eurUsdRate);
                    const buyPortionUSD = buyTotalUSD * (sellQuantity / buyQuantity);
                    const buyPortionEUR = buyPortionUSD / (buy.historicalRate || eurUsdRate);
                    const realizedGain = sellPortionEUR - buyPortionEUR;
                    
                    realizedPnL[asset.assetType] += realizedGain;
                    assetRealizedPnL += realizedGain;
                    
                    // Update remaining buy
                    remainingBuys[0].quantity -= sellQuantity;
                    remainingBuys[0].total -= buyPortionEUR;
                    sellQuantity = 0;
                }
            }
            
            if (sellQuantity > 0) {
                console.warn(`⚠️ [P&L] ${asset.symbol}: ${sellQuantity} shares could not be matched to buy orders`);
            }
        });
        
        // Store the realized P&L for this specific asset
        const assetKey = `${asset.assetType}-${asset.symbol}`;
        realizedPnL.byAsset[assetKey] = assetRealizedPnL;
        
        // Only log if there's a realized P&L (not zero)
        if (assetRealizedPnL !== 0) {
            console.log(`📈 [P&L] ${asset.symbol}: ${assetRealizedPnL.toFixed(2)} EUR`);
        }
    });
    
    // Add CS2 manual realized P&L from portfolios
    if (portfolio.cs2 && portfolio.cs2.portfolios) {
        Object.values(portfolio.cs2.portfolios).forEach((portfolioData, index) => {
            if (portfolioData.realizedPnl) {
                const eurValue = portfolioData.realizedPnl / eurUsdRate;
                realizedPnL.cs2 += eurValue;
            }
        });
    }
    
    // Calculate total realized P&L
    realizedPnL.total = realizedPnL.stocks + realizedPnL.etfs + realizedPnL.crypto + realizedPnL.cs2;
    
    // Only log summary if there's any realized P&L
    if (realizedPnL.total !== 0) {
        console.log(`📊 [P&L] Total: ${realizedPnL.total.toFixed(2)} EUR (Stocks: ${realizedPnL.stocks.toFixed(2)}, ETFs: ${realizedPnL.etfs.toFixed(2)}, Crypto: ${realizedPnL.crypto.toFixed(2)}, CS2: ${realizedPnL.cs2.toFixed(2)})`);
    }
    
    return realizedPnL;
}

// --- SOLD ASSETS ANALYSIS ---
async function fetchCurrentPriceForSoldAsset(assetType, symbol) {
    const cacheKey = `${assetType}_${symbol}`;
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Check if we have a recent cached price
    if (soldAssetsCache[cacheKey] && (now - soldAssetsCache[cacheKey].timestamp) < cacheExpiry) {
        return soldAssetsCache[cacheKey].price; // Already in EUR
    }
    
    try {
        let priceUSD = null;
        
        if (assetType === 'stocks' || assetType === 'etfs') {
            // Use existing price cache or fetch new price
            const existingPrice = priceCache[assetType][symbol];
            if (existingPrice && existingPrice.price) {
                priceUSD = existingPrice.price; // This is already in EUR from the cache
            } else {
                // Fetch from Finnhub
                const apiKey = getApiKey('finnhub');
                if (apiKey) {
                    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
                    const data = await response.json();
                    if (data && data.c) {
                        priceUSD = data.c; // This is in USD, needs conversion
                    }
                }
            }
        } else if (assetType === 'crypto') {
            // Use existing price cache or fetch new price
            const existingPrice = priceCache.crypto[symbol];
            if (existingPrice && existingPrice.price) {
                priceUSD = existingPrice.price; // This is already in EUR from the cache
            } else {
                // Fetch from CoinGecko
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
                const data = await response.json();
                if (data && data[symbol] && data[symbol].usd) {
                    priceUSD = data[symbol].usd; // This is in USD, needs conversion
                }
            }
        }
        
        if (priceUSD) {
            // Convert USD to EUR if needed
            let priceEUR = priceUSD;
            
            // Check if the price is from cache (already in EUR) or from API (in USD)
            const existingPrice = assetType === 'crypto' ? 
                priceCache.crypto[symbol] : 
                priceCache[assetType] && priceCache[assetType][symbol];
            
            if (!existingPrice) {
                // Price is from API (in USD), convert to EUR
                priceEUR = priceUSD / eurUsdRate;
            }
            
            // Cache the price in EUR
            soldAssetsCache[cacheKey] = {
                price: priceEUR,
                timestamp: now
            };
            saveSoldAssetsCache();
            
            return priceEUR;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching current price for ${symbol}:`, error);
        return null;
    }
}

function getSoldAssetsAnalysis(transactions, assetType) {
    const soldAssets = [];
    const assetGroups = {};
    
    // Group transactions by symbol
    transactions.forEach(tx => {
        if (tx.assetType === assetType && tx.type === 'sell') {
            const key = tx.symbol;
            if (!assetGroups[key]) {
                assetGroups[key] = {
                    symbol: tx.symbol,
                    sells: [],
                    buys: []
                };
            }
            assetGroups[key].sells.push(tx);
        } else if (tx.assetType === assetType && tx.type === 'buy') {
            const key = tx.symbol;
            if (!assetGroups[key]) {
                assetGroups[key] = {
                    symbol: tx.symbol,
                    sells: [],
                    buys: []
                };
            }
            assetGroups[key].buys.push(tx);
        }
    });
    
    // Process each asset that has sells
    Object.values(assetGroups).forEach(asset => {
        if (asset.sells.length > 0) {
            // Calculate total sold quantity and average sell price in EUR
            let totalSoldQuantity = 0;
            let totalSoldValueEUR = 0;
            let sellDates = [];
            
            asset.sells.forEach(sell => {
                totalSoldQuantity += sell.quantity;
                
                // Convert to EUR if the transaction was originally in USD
                let sellValueEUR = sell.total;
                if (sell.originalPrice && sell.historicalRate) {
                    // Use historical rate to convert original USD to EUR
                    sellValueEUR = (sell.originalPrice * sell.quantity) / sell.historicalRate;
                } else if (sell.originalPrice && !sell.historicalRate) {
                    // Fallback to current rate if no historical rate
                    sellValueEUR = (sell.originalPrice * sell.quantity) / eurUsdRate;
                }
                
                totalSoldValueEUR += sellValueEUR;
                sellDates.push(sell.date);
            });
            
            // Sort sell dates and create date range
            sellDates.sort((a, b) => new Date(a) - new Date(b));
            const firstSellDate = sellDates[0];
            const lastSellDate = sellDates[sellDates.length - 1];
            const sellDateRange = sellDates.length === 1 ? firstSellDate : `${firstSellDate} - ${lastSellDate}`;
            
            // Calculate average cost basis using FIFO in EUR
            let remainingBuys = [...asset.buys].sort((a, b) => new Date(a.date) - new Date(b.date));
            let totalCostBasisEUR = 0;
            let sellQuantity = totalSoldQuantity;
            
            while (sellQuantity > 0 && remainingBuys.length > 0) {
                const buy = remainingBuys[0];
                const buyQuantity = buy.quantity;
                
                if (buyQuantity <= sellQuantity) {
                    // Convert to EUR if the transaction was originally in USD
                    let buyValueEUR = buy.total;
                    if (buy.originalPrice && buy.historicalRate) {
                        // Use historical rate to convert original USD to EUR
                        buyValueEUR = (buy.originalPrice * buy.quantity) / buy.historicalRate;
                    } else if (buy.originalPrice && !buy.historicalRate) {
                        // Fallback to current rate if no historical rate
                        buyValueEUR = (buy.originalPrice * buy.quantity) / eurUsdRate;
                    }
                    
                    totalCostBasisEUR += buyValueEUR;
                    sellQuantity -= buyQuantity;
                    remainingBuys.shift();
                } else {
                    // Partial buy
                    let buyValueEUR = buy.total;
                    if (buy.originalPrice && buy.historicalRate) {
                        // Use historical rate to convert original USD to EUR
                        buyValueEUR = (buy.originalPrice * buy.quantity) / buy.historicalRate;
                    } else if (buy.originalPrice && !buy.historicalRate) {
                        // Fallback to current rate if no historical rate
                        buyValueEUR = (buy.originalPrice * buy.quantity) / eurUsdRate;
                    }
                    
                    totalCostBasisEUR += buyValueEUR * (sellQuantity / buy.quantity);
                    sellQuantity = 0;
                }
            }
            
            const averageSellPrice = totalSoldValueEUR / totalSoldQuantity;
            const averageCostBasis = totalCostBasisEUR / totalSoldQuantity;
            const realizedPnL = totalSoldValueEUR - totalCostBasisEUR;
            
            // Debug logging for sold assets analysis
            console.log(`🔍 [Sold Assets] ${asset.symbol}: Sell Value: ${totalSoldValueEUR.toFixed(2)} EUR, Cost Basis: ${totalCostBasisEUR.toFixed(2)} EUR, P&L: ${realizedPnL.toFixed(2)} EUR`);
            
            soldAssets.push({
                symbol: asset.symbol,
                quantity: totalSoldQuantity,
                averageSellPrice: averageSellPrice,
                averageCostBasis: averageCostBasis,
                realizedPnL: realizedPnL,
                sellDate: sellDateRange,
                sellDates: sellDates, // Keep individual dates for reference
                currentPrice: null // Will be fetched separately
            });
        }
    });
    
    return soldAssets;
}

async function updateSoldAssetsWithCurrentPrices(soldAssets, assetType) {
    const updatedAssets = [];
    
    for (const asset of soldAssets) {
        const currentPrice = await fetchCurrentPriceForSoldAsset(assetType, asset.symbol);
        const ifHeldPnL = currentPrice ? (currentPrice - asset.averageCostBasis) * asset.quantity : null;
        const difference = ifHeldPnL !== null ? ifHeldPnL - asset.realizedPnL : null;
        
        updatedAssets.push({
            ...asset,
            currentPrice: currentPrice,
            ifHeldPnL: ifHeldPnL,
            difference: difference
        });
    }
    
    return updatedAssets;
}

// --- PENDING FUNDS MANAGEMENT ---
function addPendingFunds(marketplace, amountUSD) {
    if (!portfolio.cs2.pendingFunds) {
        portfolio.cs2.pendingFunds = { total: 0, breakdown: {} };
    }
    
    portfolio.cs2.pendingFunds.breakdown[marketplace] = amountUSD;
    updatePendingFundsTotal();
    saveData();
}

function removePendingFunds(marketplace) {
    if (portfolio.cs2.pendingFunds && portfolio.cs2.pendingFunds.breakdown[marketplace]) {
        delete portfolio.cs2.pendingFunds.breakdown[marketplace];
        updatePendingFundsTotal();
        saveData();
    }
}

function updatePendingFundsTotal() {
    if (!portfolio.cs2.pendingFunds) {
        portfolio.cs2.pendingFunds = { total: 0, breakdown: {} };
    }
    
    let totalUSD = 0;
    Object.values(portfolio.cs2.pendingFunds.breakdown).forEach(amount => {
        totalUSD += amount;
    });
    
    portfolio.cs2.pendingFunds.total = totalUSD;
}

function getPendingFundsInEUR() {
    if (!portfolio.cs2.pendingFunds) return 0;
    return portfolio.cs2.pendingFunds.total / eurUsdRate;
}

function getTotalCS2Exposure() {
    const activeItemsValue = portfolio.cs2.value || 0;
    const pendingFundsValue = getPendingFundsInEUR();
    return activeItemsValue + pendingFundsValue;
}

function calculateHoldingTime(transactions, assetType, symbol) {
    const assetTransactions = transactions.filter(tx => 
        tx.assetType === assetType && tx.symbol === symbol
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (assetTransactions.length === 0) return null;
    
    const firstBuy = assetTransactions.find(tx => tx.type === 'buy');
    if (!firstBuy) return null;
    
    const now = new Date();
    const firstBuyDate = new Date(firstBuy.date);
    const diffTime = Math.abs(now - firstBuyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        days: diffDays,
        years: Math.floor(diffDays / 365),
        months: Math.floor((diffDays % 365) / 30),
        daysRemainder: diffDays % 30
    };
}

// --- MIGRATION TOOLS ---
async function migrateExistingUSDTransactions() {
    console.log('Starting migration of existing USD transactions...');
    
    const transactions = loadTransactions();
    const usdTransactions = transactions.filter(tx => 
        tx.originalCurrency === 'USD' && !tx.historicalRate
    );
    
    if (usdTransactions.length === 0) {
        console.log('No USD transactions found that need migration.');
        return { migrated: 0, errors: 0 };
    }
    
    console.log(`Found ${usdTransactions.length} USD transactions to migrate.`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const tx of usdTransactions) {
        try {
            const txDate = new Date(tx.date);
            const historicalRate = await fetchHistoricalExchangeRate(txDate);
            
            // Update the transaction with historical rate
            tx.historicalRate = historicalRate;
            
            // Recalculate EUR values using historical rate
            if (tx.originalPrice && tx.originalCurrency === 'USD') {
                tx.price = tx.originalPrice / historicalRate;
                tx.total = tx.originalPrice * tx.quantity / historicalRate;
            }
            
            migrated++;
            console.log(`Migrated transaction ${tx.id}: ${tx.symbol} - Rate: ${historicalRate}`);
            
            // Add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error migrating transaction ${tx.id}:`, error);
            errors++;
        }
    }
    
    // Save updated transactions
    if (migrated > 0) {
        saveTransactions(transactions);
        console.log(`Migration completed: ${migrated} transactions migrated, ${errors} errors.`);
    }
    
    return { migrated, errors };
}

function getMigrationStatus() {
    const transactions = loadTransactions();
    const usdTransactions = transactions.filter(tx => 
        tx.originalCurrency === 'USD' && !tx.historicalRate
    );
    
    return {
        totalUSDTransactions: transactions.filter(tx => tx.originalCurrency === 'USD').length,
        unmigratedUSDTransactions: usdTransactions.length,
        needsMigration: usdTransactions.length > 0
    };
}

function updateExchangeRateLabel() {
    const eurUsdLabel = document.getElementById('eur-usd-rate-label');
    const eurBtcLabel = document.getElementById('eur-btc-rate-label');
    const eurEthLabel = document.getElementById('eur-eth-rate-label');
    
    if (eurUsdLabel) {
        // Ensure eurUsdRate is a valid number
        const rate = isNaN(eurUsdRate) ? 1.0 : eurUsdRate;
        eurUsdLabel.textContent = `EUR/USD: ${rate.toFixed(4)}`;
    }
    
    const cached = getCachedCryptoRates();
    if (cached && cached.btc && cached.eth) {
        if (eurBtcLabel) {
            eurBtcLabel.textContent = `EUR/BTC: ₿${(1 / cached.btc).toFixed(6)}`;
        }
        if (eurEthLabel) {
            eurEthLabel.textContent = `EUR/ETH: Ξ${(1 / cached.eth).toFixed(6)}`;
        }
    } else {
        if (eurBtcLabel) {
            eurBtcLabel.textContent = 'EUR/BTC: --';
        }
        if (eurEthLabel) {
            eurEthLabel.textContent = 'EUR/ETH: --';
        }
    }
    
    // Update last update timestamp
    updateLastUpdateTime();
}

function resetExchangeRateLabels() {
    const eurUsdLabel = document.getElementById('eur-usd-rate-label');
    const eurBtcLabel = document.getElementById('eur-btc-rate-label');
    const eurEthLabel = document.getElementById('eur-eth-rate-label');
    
    if (eurUsdLabel) {
        eurUsdLabel.textContent = 'EUR/USD: 1.0000';
    }
    if (eurBtcLabel) {
        eurBtcLabel.textContent = 'EUR/BTC: --';
    }
    if (eurEthLabel) {
        eurEthLabel.textContent = 'EUR/ETH: --';
    }
}

function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update-time');
    if (!lastUpdateEl) return;
    
    const lastUpdate = localStorage.getItem('portfolioPilotLastUpdate');
    if (lastUpdate) {
        const updateTime = new Date(parseInt(lastUpdate));
        const now = new Date();
        const diffMs = now - updateTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        let timeText;
        if (diffMins < 1) {
            timeText = 'Just now';
        } else if (diffMins < 60) {
            timeText = `${diffMins}m ago`;
        } else if (diffHours < 24) {
            timeText = `${diffHours}h ago`;
        } else {
            timeText = updateTime.toLocaleDateString();
        }
        
        lastUpdateEl.textContent = timeText;
    } else {
        lastUpdateEl.textContent = 'Never';
    }
}

function setLastUpdateTime() {
    localStorage.setItem('portfolioPilotLastUpdate', Date.now().toString());
    updateLastUpdateTime();
}

// --- BENCHMARK DATA ---
function getCachedBenchmarkData() {
    try {
        const cached = JSON.parse(localStorage.getItem('portfolioPilotBenchmarkData'));
        if (cached && cached.timestamp && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) { // 24 hours
            return cached;
        }
    } catch (e) {
        console.error('Error loading benchmark data:', e);
    }
    return null;
}

function setCachedBenchmarkData(sp500, nasdaq) {
    localStorage.setItem('portfolioPilotBenchmarkData', JSON.stringify({
        sp500,
        nasdaq,
        timestamp: Date.now()
    }));
}

function setCachedBenchmarkHistory(sp500History, nasdaqHistory) {
    const data = {
        sp500History: sp500History,
        nasdaqHistory: nasdaqHistory,
        timestamp: Date.now()
    };
    localStorage.setItem('portfolioPilotBenchmarkHistory', JSON.stringify(data));
}

function getCachedBenchmarkHistory() {
    try {
        const cached = JSON.parse(localStorage.getItem('portfolioPilotBenchmarkHistory'));
        if (cached && cached.timestamp && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) { // 24 hours
            return cached;
        }
    } catch {}
    return null;
}

// New optimized caching functions for benchmark data by date
function setCachedBenchmarkDataForDate(date, sp500Value, nasdaqValue) {
    try {
        const cached = getCachedBenchmarkDataByDate();
        cached[date] = {
            sp500: sp500Value,
            nasdaq: nasdaqValue,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotBenchmarkDataByDate', JSON.stringify(cached));
    } catch (e) {
        console.error('Error caching benchmark data for date:', e);
    }
}

function getCachedBenchmarkDataByDate() {
    try {
        const cached = localStorage.getItem('portfolioPilotBenchmarkDataByDate');
        return cached ? JSON.parse(cached) : {};
    } catch (e) {
        return {};
    }
}

function getCachedBenchmarkDataForDate(date) {
    try {
        const cached = getCachedBenchmarkDataByDate();
        const dateData = cached[date];
        if (dateData && dateData.timestamp && Date.now() - dateData.timestamp < 1000 * 60 * 60 * 24 * 7) { // 7 days
            return dateData;
        }
    } catch (e) {
        console.error('Error getting cached benchmark data for date:', e);
    }
    return null;
}

// New optimized function to fetch benchmark data for a specific date
async function fetchBenchmarkDataForDate(date) {
    try {
        // Fetch S&P 500 (^GSPC) and NASDAQ (^IXIC) data for the specific date
        const sp500Url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=5d`;
        const nasdaqUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=5d`;
        
        const [sp500Res, nasdaqRes] = await Promise.all([
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(sp500Url)}`),
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(nasdaqUrl)}`)
        ]);
        
        const [sp500ProxyData, nasdaqProxyData] = await Promise.all([
            sp500Res.json(),
            nasdaqRes.json()
        ]);
        
        const sp500Data = JSON.parse(sp500ProxyData.contents);
        const nasdaqData = JSON.parse(nasdaqProxyData.contents);
        
        if (sp500Data.chart && sp500Data.chart.result && sp500Data.chart.result[0]) {
            const sp500Result = sp500Data.chart.result[0];
            const sp500Quotes = sp500Result.indicators.quote[0];
            const sp500Timestamps = sp500Result.timestamp;
            
            if (nasdaqData.chart && nasdaqData.chart.result && nasdaqData.chart.result[0]) {
                const nasdaqResult = nasdaqData.chart.result[0];
                const nasdaqQuotes = nasdaqResult.indicators.quote[0];
                const nasdaqTimestamps = nasdaqResult.timestamp;
                
                // Find the data point closest to the requested date
                let sp500Value = null;
                let nasdaqValue = null;
                
                // Look for the exact date or the closest available date
                for (let i = 0; i < sp500Timestamps.length; i++) {
                    const timestampDate = new Date(sp500Timestamps[i] * 1000).toISOString().split('T')[0];
                    if (timestampDate === date && sp500Quotes.close[i] !== null) {
                        sp500Value = sp500Quotes.close[i];
                        break;
                    }
                }
                
                for (let i = 0; i < nasdaqTimestamps.length; i++) {
                    const timestampDate = new Date(nasdaqTimestamps[i] * 1000).toISOString().split('T')[0];
                    if (timestampDate === date && nasdaqQuotes.close[i] !== null) {
                        nasdaqValue = nasdaqQuotes.close[i];
                        break;
                    }
                }
                
                // If exact date not found, get the latest available data
                if (!sp500Value) {
                    for (let i = sp500Quotes.close.length - 1; i >= 0; i--) {
                        if (sp500Quotes.close[i] !== null && sp500Quotes.close[i] !== undefined) {
                            sp500Value = sp500Quotes.close[i];
                            break;
                        }
                    }
                }
                
                if (!nasdaqValue) {
                    for (let i = nasdaqQuotes.close.length - 1; i >= 0; i--) {
                        if (nasdaqQuotes.close[i] !== null && nasdaqQuotes.close[i] !== undefined) {
                            nasdaqValue = nasdaqQuotes.close[i];
                            break;
                        }
                    }
                }
                
                if (sp500Value && nasdaqValue) {
                    console.log(`Benchmark data fetched for ${date}:`, { sp500: sp500Value, nasdaq: nasdaqValue });
                    return { 
                        sp500: sp500Value, 
                        nasdaq: nasdaqValue,
                        date: date
                    };
                } else {
                    console.error('Invalid benchmark prices for date:', date, { sp500: sp500Value, nasdaq: nasdaqValue });
                }
            }
        }
        
        throw new Error('Invalid benchmark data received');
    } catch (e) {
        console.error(`Error fetching benchmark data for ${date}:`, e);
        return null;
    }
}

// Legacy function - now only fetches current benchmark data (no historical)
async function fetchBenchmarkData() {
    try {
        // Fetch S&P 500 (^GSPC) and NASDAQ (^IXIC) current data only
        const sp500Url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=5d`;
        const nasdaqUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=5d`;
        
        const [sp500Res, nasdaqRes] = await Promise.all([
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(sp500Url)}`),
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(nasdaqUrl)}`)
        ]);
        
        const [sp500ProxyData, nasdaqProxyData] = await Promise.all([
            sp500Res.json(),
            nasdaqRes.json()
        ]);
        
        const sp500Data = JSON.parse(sp500ProxyData.contents);
        const nasdaqData = JSON.parse(nasdaqProxyData.contents);
        
        if (sp500Data.chart && sp500Data.chart.result && sp500Data.chart.result[0]) {
            const sp500Result = sp500Data.chart.result[0];
            const sp500Quotes = sp500Result.indicators.quote[0];
            
            // Get the latest valid price (skip null values)
            let sp500Price = null;
            for (let i = sp500Quotes.close.length - 1; i >= 0; i--) {
                if (sp500Quotes.close[i] !== null && sp500Quotes.close[i] !== undefined) {
                    sp500Price = sp500Quotes.close[i];
                    break;
                }
            }
            
            if (nasdaqData.chart && nasdaqData.chart.result && nasdaqData.chart.result[0]) {
                const nasdaqResult = nasdaqData.chart.result[0];
                const nasdaqQuotes = nasdaqResult.indicators.quote[0];
                
                // Get the latest valid price (skip null values)
                let nasdaqPrice = null;
                for (let i = nasdaqQuotes.close.length - 1; i >= 0; i--) {
                    if (nasdaqQuotes.close[i] !== null && nasdaqQuotes.close[i] !== undefined) {
                        nasdaqPrice = nasdaqQuotes.close[i];
                        break;
                    }
                }
                
                if (sp500Price && nasdaqPrice) {
                    console.log('Current benchmark data fetched:', { sp500: sp500Price, nasdaq: nasdaqPrice });
                    setCachedBenchmarkData(sp500Price, nasdaqPrice);
                    return { 
                        sp500: sp500Price, 
                        nasdaq: nasdaqPrice
                    };
                } else {
                    console.error('Invalid benchmark prices:', { sp500: sp500Price, nasdaq: nasdaqPrice });
                }
            }
        }
        
        throw new Error('Invalid benchmark data received');
    } catch (e) {
        console.error('Error fetching benchmark data:', e);
        return null;
    }
}

// --- AUTOMATIC PRICE FETCHING ---
async function fetchAllAssetPrices() {
    try {
        loadData(); // Load data into global portfolio variable
        console.log('Portfolio data loaded:', {
            stocks: portfolio.stocks?.length || 0,
            etfs: portfolio.etfs?.length || 0,
            crypto: portfolio.crypto?.length || 0
        });
        
        const results = {
            stocks: { success: 0, failed: 0, total: 0 },
            etfs: { success: 0, failed: 0, total: 0 },
            crypto: { success: 0, failed: 0, total: 0 }
        };
        
        // Fetch stock prices
        if (portfolio.stocks && portfolio.stocks.length > 0) {
            results.stocks.total = portfolio.stocks.length;
            const stockPromises = portfolio.stocks.map(stock => 
                fetchStockPrice(stock.name).then(price => {
                    if (price) {
                        setCachedPrice('stocks', stock.name, price);
                        results.stocks.success++;
                    } else {
                        results.stocks.failed++;
                    }
                }).catch(error => {
                    console.error(`Error fetching price for stock ${stock.name}:`, error);
                    results.stocks.failed++;
                })
            );
            await Promise.allSettled(stockPromises);
        }
        
        // Fetch ETF prices
        if (portfolio.etfs && portfolio.etfs.length > 0) {
            results.etfs.total = portfolio.etfs.length;
            const etfPromises = portfolio.etfs.map(etf => 
                fetchStockPrice(etf.name).then(price => {
                    if (price) {
                        setCachedPrice('etfs', etf.name, price);
                        results.etfs.success++;
                    } else {
                        results.etfs.failed++;
                    }
                }).catch(error => {
                    console.error(`Error fetching price for ETF ${etf.name}:`, error);
                    results.etfs.failed++;
                })
            );
            await Promise.allSettled(etfPromises);
        }
        
        // Fetch crypto prices
        if (portfolio.crypto && portfolio.crypto.length > 0) {
            results.crypto.total = portfolio.crypto.length;
            const cryptoPromises = portfolio.crypto.map(crypto => {
                return fetchCryptoPrice(crypto.name, crypto.currency).then(price => {
                    if (price) {
                        setCachedPrice('crypto', crypto.name, price);
                        results.crypto.success++;
                    } else {
                        results.crypto.failed++;
                    }
                }).catch(error => {
                    console.error(`Error fetching price for crypto ${crypto.name}:`, error);
                    results.crypto.failed++;
                });
            });
            await Promise.allSettled(cryptoPromises);
        }
        
        // Update last fetch time
        setLastUpdateTime();
        
        console.log('Asset prices fetch results:', results);
        
        // Set update status for each asset type
        setUpdateStatus('stocks', results.stocks.failed > 0 ? 'error' : 'success');
        setUpdateStatus('etfs', results.etfs.failed > 0 ? 'error' : 'success');
        setUpdateStatus('crypto', results.crypto.failed > 0 ? 'error' : 'success');
        
        // Check if we have any assets to update
        const totalAssets = results.stocks.total + results.etfs.total + results.crypto.total;
        if (totalAssets === 0) {
            console.log('No assets found to update');
        }
        
        return results;
    } catch (error) {
        console.error('Error fetching asset prices:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return false;
    }
}

// Manual trigger for fetching all asset prices
async function updateAllAssetPrices() {
    showNotification('Updating all asset prices...', 'info');
    const results = await fetchAllAssetPrices();
    if (results) {
        // Show individual results for each asset class
        if (results.stocks.total > 0) {
            const stockMessage = `Stocks: ${results.stocks.success}/${results.stocks.total} updated`;
            showNotification(stockMessage, results.stocks.failed === 0 ? 'success' : 'warning');
        }
        if (results.etfs.total > 0) {
            const etfMessage = `ETFs: ${results.etfs.success}/${results.etfs.total} updated`;
            showNotification(etfMessage, results.etfs.failed === 0 ? 'success' : 'warning');
        }
        if (results.crypto.total > 0) {
            const cryptoMessage = `Crypto: ${results.crypto.success}/${results.crypto.total} updated`;
            showNotification(cryptoMessage, results.crypto.failed === 0 ? 'success' : 'warning');
        }
        
        // Trigger page refresh to show updated prices
        setTimeout(() => {
            if (typeof loadStocks === 'function') loadStocks();
            if (typeof loadETFs === 'function') loadETFs();
            if (typeof loadCrypto === 'function') loadCrypto();
        }, 1000);
    } else {
        showNotification('Error updating asset prices. Check console for details.', 'error');
    }
}

// --- SCHEDULED UPDATES ---
function startScheduledUpdates() {
    // Check if we should auto-update (every hour)
    const lastUpdate = localStorage.getItem('portfolioPilotLastUpdate');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (!lastUpdate || (now - parseInt(lastUpdate)) > oneHour) {
        // Auto-fetch if it's been more than an hour
        fetchExchangeRate();
        fetchAllAssetPrices();
        // Update dashboard status if on dashboard page
        if (typeof updateAutoUpdatesStatus === 'function') {
            updateAutoUpdatesStatus();
        }
    }
    
    // Set up interval to check every 30 minutes
    setInterval(() => {
        const lastUpdate = localStorage.getItem('portfolioPilotLastUpdate');
        const now = Date.now();
        
        if (!lastUpdate || (now - parseInt(lastUpdate)) > oneHour) {
            fetchExchangeRate();
            fetchAllAssetPrices();
            // Update dashboard status if on dashboard page
            if (typeof updateAutoUpdatesStatus === 'function') {
                updateAutoUpdatesStatus();
            }
        }
    }, 30 * 60 * 1000); // Check every 30 minutes
}

// --- PRICE CACHE ---
function loadPriceCache() {
    try {
        const cache = localStorage.getItem('portfolioPilotPriceCache');
        if (cache) {
            const parsedCache = JSON.parse(cache);
            // Ensure all required properties exist
            priceCache = {
                stocks: parsedCache.stocks || {},
                crypto: parsedCache.crypto || {},
                etfs: parsedCache.etfs || {}
            };
        }
    } catch (e) {
        priceCache = { stocks: {}, crypto: {}, etfs: {} };
    }
}

function savePriceCache() {
    try {
        localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(priceCache));
    } catch (e) {
        // ignore
    }
}

function setCachedPrice(type, name, priceData) {
    // Ensure priceCache has the proper structure
    if (!priceCache.stocks) priceCache.stocks = {};
    if (!priceCache.crypto) priceCache.crypto = {};
    if (!priceCache.etfs) priceCache.etfs = {};
    
    if (!priceCache[type]) {
        priceCache[type] = {};
    }
    
    // Handle both old format (just price) and new format (object with price and change24h)
    if (typeof priceData === 'number') {
        priceCache[type][name] = {
            price: priceData,
            timestamp: Date.now()
        };
    } else if (priceData && typeof priceData === 'object') {
        priceCache[type][name] = {
            price: priceData.price,
            change24h: priceData.change24h,
            originalPrice: priceData.originalPrice,
            originalCurrency: priceData.originalCurrency,
            timestamp: Date.now()
        };
    }
    
    savePriceCache();
}

// --- CRYPTO RATES CACHE ---
function getCachedCryptoRates() {
    try {
        const cached = JSON.parse(localStorage.getItem('portfolioPilotCryptoRates'));
        if (cached && cached.timestamp && Date.now() - cached.timestamp < 1000 * 60 * 60) {
            return cached;
        }
    } catch {}
    return null;
}

function setCachedCryptoRates(btc, eth) {
    localStorage.setItem('portfolioPilotCryptoRates', JSON.stringify({
        btc,
        eth,
        timestamp: Date.now()
    }));
}

// --- API FUNCTIONS ---
async function fetchStockPrice(ticker) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        
        const result = data.chart?.result?.[0];
        if (!result) {
            console.error(`Could not fetch price for stock: ${ticker}`, data);
            return null;
        }
        
        // Extract currency from Yahoo Finance response
        const currency = result.meta?.currency || 'USD';
        console.log(`Yahoo Finance currency for ${ticker}: ${currency}`);
        
        const closeArr = result.indicators?.quote?.[0]?.close;
        if (!closeArr || !closeArr.length) {
            console.error(`No close prices for stock: ${ticker}`, data);
            return null;
        }
        
        let currentPrice = null;
        let previousPrice = null;
        
        // Get current price (latest non-null value)
        for (let i = closeArr.length - 1; i >= 0; i--) {
            if (typeof closeArr[i] === 'number') {
                currentPrice = closeArr[i];
                break;
            }
        }
        
        // Get previous day's price (second latest non-null value)
        for (let i = closeArr.length - 2; i >= 0; i--) {
            if (typeof closeArr[i] === 'number') {
                previousPrice = closeArr[i];
                break;
            }
        }
        
        if (!currentPrice) {
            console.error(`No valid close price for stock: ${ticker}`, data);
            return null;
        }
        
        // Calculate 24h change percentage
        let change24h = 0;
        if (previousPrice && previousPrice > 0) {
            change24h = ((currentPrice - previousPrice) / previousPrice) * 100;
        }
        
        // Convert USD prices to EUR if needed
        let priceInEur = currentPrice;
        if (currency === 'USD') {
            const eurUsdRate = parseFloat(localStorage.getItem('eurUsdRate'));
            if (eurUsdRate && eurUsdRate > 0) {
                priceInEur = currentPrice / eurUsdRate;
                console.log(`Converted ${ticker} price from ${currency} ${currentPrice} to EUR ${priceInEur.toFixed(2)} (rate: ${eurUsdRate})`);
            } else {
                console.warn(`No valid EUR/USD rate found for ${ticker} conversion`);
            }
        }
        
        return {
            price: priceInEur,
            originalPrice: currentPrice,
            originalCurrency: currency,
            change24h: change24h
        };
    } catch (error) {
        console.error(`Error fetching stock price for ${ticker}:`, error);
        return null;
    }
}

async function fetchCryptoPrice(name, currency = 'USD') {
    const searchId = name.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${searchId}&vs_currencies=${currency.toLowerCase()}&include_24hr_change=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const cryptoData = data[searchId];
        if (!cryptoData) {
            console.error(`Could not fetch price for crypto: ${name} (searched for ${searchId})`, data);
            return null;
        }
        
        const price = cryptoData[currency.toLowerCase()];
        const change24h = cryptoData[`${currency.toLowerCase()}_24h_change`];
        
        return {
            price: price,
            change24h: change24h
        };
    } catch (error) {
        console.error(`Error fetching crypto price for ${name}:`, error);
        return null;
    }
}

async function fetchExchangeRate() {
    try {
        console.log('Fetching exchange rate from Frankfurter...');
        // Fetch EUR/USD rate from Frankfurter
        const eurUsdRes = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
        const eurUsdData = await eurUsdRes.json();
        console.log('Frankfurter response:', eurUsdData);
        
        if (eurUsdData && eurUsdData.rates && eurUsdData.rates.USD) {
            console.log('EUR/USD rate from Frankfurter:', eurUsdData.rates.USD);
            saveExchangeRate(eurUsdData.rates.USD);
        } else {
            console.error('Failed to fetch EUR/USD rate, response:', eurUsdData);
            setUpdateStatus('rates', 'error');
            return false;
        }
        
        // Fetch EUR/BTC and EUR/ETH rates from CoinGecko
        const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur');
        const cryptoData = await cryptoRes.json();
        
        if (cryptoData && cryptoData.bitcoin && cryptoData.ethereum) {
            const btcEur = cryptoData.bitcoin.eur;
            const ethEur = cryptoData.ethereum.eur;
            setCachedCryptoRates(btcEur, ethEur);
        }
        
        // Update all rate labels after fetching
        updateExchangeRateLabel();
        setLastUpdateTime();
        setUpdateStatus('rates', 'success');
        return true;
    } catch (e) {
        console.error('Error fetching exchange rates:', e);
        return false;
    }
}

// --- TRANSACTIONS ---
function loadTransactions() {
    try {
        const data = localStorage.getItem('portfolioPilotTransactions');
        if (data) return JSON.parse(data);
    } catch {}
    return [];
}

function saveTransactions(transactions) {
    try {
        localStorage.setItem('portfolioPilotTransactions', JSON.stringify(transactions));
    } catch (e) {
        console.error('Error saving transactions:', e);
    }
}

function getTransactionTotals(transactions) {
    const types = ['stocks', 'etfs', 'crypto', 'cs2'];
    const totals = {};
    types.forEach(type => {
        totals[type] = { deposit: 0, withdrawal: 0 };
    });
    transactions.forEach(tx => {
        if (!totals[tx.assetType]) return;
        if (tx.type === 'deposit') totals[tx.assetType].deposit += tx.amount;
        if (tx.type === 'withdrawal') totals[tx.assetType].withdrawal += tx.amount;
    });
    return totals;
}

function addTransaction(transaction) {
    try {
        let transactions = loadTransactions();
        transactions.push(transaction);
        saveTransactions(transactions);
    } catch (e) {
        console.error('Error adding transaction:', e);
    }
}

// --- VALIDATED HISTORY ---
function loadValidatedHistory() {
    try {
        const data = localStorage.getItem('portfolioPilotValidatedHistory');
        if (data) return JSON.parse(data);
    } catch {}
    return [];
}

function saveValidatedHistory(history) {
    localStorage.setItem('portfolioPilotValidatedHistory', JSON.stringify(history));
}

// --- UTILITY FUNCTIONS ---
function showNotification(message, type = 'info') {
    // Simple notification system - can be enhanced with a proper UI
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function formatCurrency(value, currency = 'EUR') {
    // Handle undefined, null, or invalid values
    if (value === undefined || value === null || isNaN(value)) {
        value = 0;
    }
    
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${value.toLocaleString(undefined, {maximumFractionDigits:2})}`;
}

function calculateTotalValue() {
    let totalValue = 0;
    
    // Calculate stocks value
    portfolio.stocks.forEach(stock => {
        const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
        const price = cachedData.price || 0; // Price is already in EUR
        const value = price * stock.quantity;
        totalValue += value;
    });
    
    // Calculate ETFs value
    portfolio.etfs.forEach(etf => {
        const cachedData = (priceCache.etfs && priceCache.etfs[etf.name]) || {};
        const price = cachedData.price || 0; // Price is already in EUR
        const value = price * etf.quantity;
        totalValue += value;
    });
    
    // Calculate crypto value
    portfolio.crypto.forEach(crypto => {
        const cachedData = (priceCache.crypto && priceCache.crypto[crypto.name]) || {};
        const price = cachedData.price || 0;
        let value = price * crypto.quantity;
        if (crypto.currency === 'USD') value = value / eurUsdRate;
        totalValue += value;
    });
    
    // Calculate static assets value
    portfolio.static.forEach(asset => {
        if (asset.values && asset.values.length > 0) {
            const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            let value = latest.value;
            if (latest.currency === 'USD') value = value / eurUsdRate;
            totalValue += value;
        }
    });
    
    // Add CS2 value (now handles dynamic portfolios)
    if (portfolio.cs2) {
        let cs2Value = 0;
        
        // If we have the combined total in EUR (new structure)
        if (typeof portfolio.cs2.value === 'number' && portfolio.cs2.currency === 'EUR') {
            cs2Value = portfolio.cs2.value;
        }
        // If we have dynamic portfolios structure
        else if (portfolio.cs2.portfolios) {
            const totalUsd = Object.values(portfolio.cs2.portfolios)
                .reduce((sum, p) => sum + (p.value || 0), 0);
            cs2Value = totalUsd / eurUsdRate;
        }
        // Legacy structure (playItems + investmentItems)
        else {
            const playItemsValue = portfolio.cs2.playItems?.value || 0;
            const investmentItemsValue = portfolio.cs2.investmentItems?.value || 0;
            const totalUsd = playItemsValue + investmentItemsValue;
            cs2Value = totalUsd / eurUsdRate;
        }
        
        totalValue += cs2Value;
    }
    
    return totalValue;
}

function updateTotalValueBar(eurValue) {
    const elEur = document.getElementById('portfolio-total-eur');
    const elUsd = document.getElementById('portfolio-total-usd');
    const elBtc = document.getElementById('portfolio-total-btc');
    const elEth = document.getElementById('portfolio-total-eth');
    const elEurBtc = document.getElementById('eur-btc-rate-label');
    const elEurEth = document.getElementById('eur-eth-rate-label');
    
    if (elEur) elEur.textContent = `€${eurValue.toLocaleString(undefined, {maximumFractionDigits:2})}`;
    if (elUsd) elUsd.textContent = `$${(eurValue * eurUsdRate).toLocaleString(undefined, {maximumFractionDigits:2})}`;
    
    const cached = getCachedCryptoRates();
    if (cached && cached.btc && cached.eth) {
        if (elBtc) elBtc.textContent = `₿${(eurValue / cached.btc).toFixed(4)}`;
        if (elEth) elEth.textContent = `Ξ${(eurValue / cached.eth).toFixed(4)}`;
        if (elEurBtc) elEurBtc.textContent = `EUR/BTC: ₿${(1 / cached.btc).toFixed(6)}`;
        if (elEurEth) elEurEth.textContent = `EUR/ETH: Ξ${(1 / cached.eth).toFixed(6)}`;
    } else {
        if (elBtc) elBtc.textContent = '₿--';
        if (elEth) elEth.textContent = 'Ξ--';
        if (elEurBtc) elEurBtc.textContent = 'EUR/BTC: --';
        if (elEurEth) elEurEth.textContent = 'EUR/ETH: --';
    }
}

// --- EXPORT/IMPORT FUNCTIONS ---
function exportToCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'type,name,static_type,quantity,purchase_price,currency\r\n';
    
    portfolio.stocks.forEach(stock => {
        csvContent += `stock,${stock.name},,${stock.quantity},${stock.purchasePrice},${stock.currency}\r\n`;
    });
    
    portfolio.etfs.forEach(etf => {
        csvContent += `etf,${etf.name},,${etf.quantity},${etf.purchasePrice},${etf.currency}\r\n`;
    });
    
    portfolio.crypto.forEach(crypto => {
        csvContent += `crypto,${crypto.name},,${crypto.quantity},${crypto.purchasePrice},${crypto.currency}\r\n`;
    });
    
    portfolio.static.forEach(asset => {
        if (asset.values && asset.values.length > 0) {
            const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            csvContent += `static,${asset.name},${asset.type},1,${latest.value},${latest.currency}\r\n`;
        }
    });
    
    // Export CS2 as separate asset type
    if (portfolio.cs2 && typeof portfolio.cs2.value === 'number' && portfolio.cs2.value > 0) {
        csvContent += `cs2,CS2 Items,,1,${portfolio.cs2.value},${portfolio.cs2.currency}\r\n`;
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'portfolio_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importFromCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
        const rows = text.split(/\r?\n|\r/).filter(row => row.trim().length > 0);
        
        if (rows.length < 2) {
            alert('CSV file is empty or invalid.');
            return;
        }
        
        const header = rows[0].split(',');
        const idx = name => header.indexOf(name);
        
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (!cols.length || !cols[0]) continue;
            
            const type = cols[idx('type')];
            const name = cols[idx('name')];
            const staticType = cols[idx('static_type')] || '';
            const quantity = parseFloat(cols[idx('quantity')]) || 0;
            const purchasePrice = parseFloat(cols[idx('purchase_price')]) || 0;
            const currency = cols[idx('currency')] || 'EUR';
            
            const asset = {
                id: Date.now() + i,
                name,
                quantity,
                purchasePrice,
                currency
            };
            
            switch (type) {
                case 'stock':
                    portfolio.stocks.push(asset);
                    break;
                case 'etf':
                    portfolio.etfs.push(asset);
                    break;
                case 'crypto':
                    portfolio.crypto.push(asset);
                    break;
                case 'static':
                    const assetType = staticType || 'Cash';
                    portfolio.static.push({
                        id: Date.now() + i,
                        name,
                        type: assetType,
                        values: [{
                            date: new Date().toISOString().slice(0, 10),
                            value: purchasePrice,
                            currency
                        }]
                    });
                    break;
                case 'cs2':
                    // Import CS2 as separate asset type
                    portfolio.cs2 = { value: purchasePrice, currency: currency || 'EUR' };
                    break;
            }
        }
        
        saveData();
        showNotification('Portfolio imported successfully!', 'success');
        location.reload();
    };
    
    reader.readAsText(file);
}

function exportValidatedHistoryToCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'date,stocks,etfs,crypto,static,cs2,savings,emergency,cash,total,eur,usd,btc,eth\r\n';
    const validatedHistory = loadValidatedHistory();
    validatedHistory.forEach(entry => {
        csvContent += `${entry.date},${entry.stocks ?? 0},${entry.etfs ?? 0},${entry.crypto ?? 0},${entry.static ?? 0},${entry.cs2 ?? 0},${entry.savings ?? 0},${entry.emergency ?? 0},${entry.cash ?? 0},${entry.total ?? 0},${entry.eur ?? ''},${entry.usd ?? ''},${entry.btc ?? ''},${entry.eth ?? ''}\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'portfolio_validated_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importValidatedHistoryFromCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\r\n').filter(row => row.length > 0);
        if (rows.length < 2) {
            alert('CSV file is empty or invalid.');
            return;
        }
        const header = rows[0].split(',');
        const idx = name => header.indexOf(name);
        const history = [];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (!cols.length || !cols[0]) continue;
            history.push({
                date: cols[idx('date')],
                stocks: parseFloat(cols[idx('stocks')] ?? 0) || 0,
                etfs: parseFloat(cols[idx('etfs')] ?? 0) || 0,
                crypto: parseFloat(cols[idx('crypto')] ?? 0) || 0,
                static: parseFloat(cols[idx('static')] ?? 0) || 0,
                cs2: parseFloat(cols[idx('cs2')] ?? 0) || 0,
                savings: parseFloat(cols[idx('savings')] ?? 0) || 0,
                emergency: parseFloat(cols[idx('emergency')] ?? 0) || 0,
                cash: parseFloat(cols[idx('cash')] ?? 0) || 0,
                total: parseFloat(cols[idx('total')] ?? 0) || 0,
                eur: parseFloat(cols[idx('eur')] ?? 0) || 0,
                usd: parseFloat(cols[idx('usd')] ?? 0) || 0,
                btc: parseFloat(cols[idx('btc')] ?? 0) || 0,
                eth: parseFloat(cols[idx('eth')] ?? 0) || 0
            });
        }
        saveValidatedHistory(history);
        showNotification('Portfolio validated history imported successfully!', 'success');
        location.reload();
    };
    reader.readAsText(file);
}

// --- BACKUP/RESTORE FUNCTIONS ---
function exportAllData() {
    try {
        // Collect all data from localStorage
        const backupData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            description: 'Complete Portfolio Pilot backup - includes all data, transactions, notes, and API keys',
            data: {
                // Core portfolio data
                portfolio: JSON.parse(localStorage.getItem('portfolioPilotData') || '{}'),
                transactions: JSON.parse(localStorage.getItem('portfolioPilotTransactions') || '[]'),
                validatedHistory: JSON.parse(localStorage.getItem('portfolioPilotValidatedHistory') || '[]'),
                
                // Market data and rates
                priceCache: JSON.parse(localStorage.getItem('portfolioPilotPriceCache') || '{}'),
                eurUsdRate: localStorage.getItem('eurUsdRate') || '1.0',
                historicalRates: JSON.parse(localStorage.getItem('historicalRates') || '{}'),
                soldAssetsCache: JSON.parse(localStorage.getItem('soldAssetsCache') || '{}'),
                cryptoRates: localStorage.getItem('portfolioPilotCryptoRates'),
                benchmarkData: localStorage.getItem('portfolioPilotBenchmarkData'),
                benchmarkHistory: localStorage.getItem('portfolioPilotBenchmarkHistory'),
                benchmarkDataByDate: localStorage.getItem('portfolioPilotBenchmarkDataByDate'),
                stockEarnings: localStorage.getItem('portfolioPilotStockEarnings'),
                cryptoEvents: localStorage.getItem('portfolioPilotCryptoEvents'),
                lastUpdate: localStorage.getItem('portfolioPilotLastUpdate'),
                
                // Investment notes
                notes: {
                    stocks: localStorage.getItem('stocksNotes') || '',
                    etfs: localStorage.getItem('etfsNotes') || '',
                    crypto: localStorage.getItem('cryptoNotes') || '',
                    cs2: localStorage.getItem('cs2Notes') || '',
                    api: localStorage.getItem('apiNotes') || ''
                },
                
                // API keys (encrypted/masked for security)
                apiKeys: {
                    yahooFinance: getEncryptedItem('portfolioPilotYahooFinance') ? '***CONFIGURED***' : null,
                    alphaVantage: getEncryptedItem('portfolioPilotAlphaVantage') ? '***CONFIGURED***' : null,
                    coinGecko: getEncryptedItem('portfolioPilotCoinGecko') ? '***CONFIGURED***' : null,
                    finnhub: getEncryptedItem('portfolioPilotFinnhub') ? '***CONFIGURED***' : null,
                    coinMarketCal: getEncryptedItem('portfolioPilotCoinMarketCal') ? '***CONFIGURED***' : null
                },
                
                // Database configuration (encrypted)
                databaseConfig: getEncryptedItem('assetflow_database_config'),
                userId: getEncryptedItem('assetflow_user_id'),
                
                // Usage statistics
                usageStats: {
                    yahooFinance: localStorage.getItem('portfolioPilotYahooFinanceUsage') || '{}',
                    alphaVantage: localStorage.getItem('portfolioPilotAlphaVantageUsage') || '{}',
                    coinGecko: localStorage.getItem('portfolioPilotCoinGeckoUsage') || '{}',
                    finnhub: localStorage.getItem('portfolioPilotFinnhubUsage') || '{}',
                    coinMarketCal: localStorage.getItem('portfolioPilotCoinMarketCalUsage') || '{}'
                }
            }
        };
        
        // Create and download the backup file
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Complete portfolio backup created successfully!', 'success');
    } catch (error) {
        console.error('Error creating backup:', error);
        showNotification('Error creating backup. Please try again.', 'error');
    }
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Validate backup data structure
            if (!backupData.version || !backupData.data) {
                throw new Error('Invalid backup file format');
            }
            
            // Confirm restore action
            const confirmMessage = `This will replace all current data with the backup from ${backupData.timestamp ? new Date(backupData.timestamp).toLocaleString() : 'unknown date'}. Are you sure?`;
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Restore all data
            if (backupData.data.portfolio) {
                localStorage.setItem('portfolioPilotData', JSON.stringify(backupData.data.portfolio));
            }
            if (backupData.data.transactions) {
                localStorage.setItem('portfolioPilotTransactions', JSON.stringify(backupData.data.transactions));
            }
            if (backupData.data.validatedHistory) {
                localStorage.setItem('portfolioPilotValidatedHistory', JSON.stringify(backupData.data.validatedHistory));
            }
            if (backupData.data.priceCache) {
                localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(backupData.data.priceCache));
            }
            if (backupData.data.eurUsdRate) {
                localStorage.setItem('eurUsdRate', backupData.data.eurUsdRate);
            }
            if (backupData.data.historicalRates) {
                localStorage.setItem('historicalRates', JSON.stringify(backupData.data.historicalRates));
            }
            if (backupData.data.soldAssetsCache) {
                localStorage.setItem('soldAssetsCache', JSON.stringify(backupData.data.soldAssetsCache));
            }
            if (backupData.data.cryptoRates) {
                localStorage.setItem('portfolioPilotCryptoRates', backupData.data.cryptoRates);
            }
            if (backupData.data.benchmarkData) {
                localStorage.setItem('portfolioPilotBenchmarkData', backupData.data.benchmarkData);
            }
            if (backupData.data.lastUpdate) {
                localStorage.setItem('portfolioPilotLastUpdate', backupData.data.lastUpdate);
            }
            if (backupData.data.benchmarkHistory) {
                localStorage.setItem('portfolioPilotBenchmarkHistory', backupData.data.benchmarkHistory);
            }
            if (backupData.data.benchmarkDataByDate) {
                localStorage.setItem('portfolioPilotBenchmarkDataByDate', backupData.data.benchmarkDataByDate);
            }
            if (backupData.data.stockEarnings) {
                localStorage.setItem('portfolioPilotStockEarnings', backupData.data.stockEarnings);
            }
            if (backupData.data.cryptoEvents) {
                localStorage.setItem('portfolioPilotCryptoEvents', backupData.data.cryptoEvents);
            }
            
            // Restore notes
            if (backupData.data.notes) {
                if (backupData.data.notes.stocks) localStorage.setItem('stocksNotes', backupData.data.notes.stocks);
                if (backupData.data.notes.etfs) localStorage.setItem('etfsNotes', backupData.data.notes.etfs);
                if (backupData.data.notes.crypto) localStorage.setItem('cryptoNotes', backupData.data.notes.crypto);
                if (backupData.data.notes.cs2) localStorage.setItem('cs2Notes', backupData.data.notes.cs2);
                if (backupData.data.notes.api) localStorage.setItem('apiNotes', backupData.data.notes.api);
            }
            
            // Restore usage statistics
            if (backupData.data.usageStats) {
                if (backupData.data.usageStats.yahooFinance) localStorage.setItem('portfolioPilotYahooFinanceUsage', backupData.data.usageStats.yahooFinance);
                if (backupData.data.usageStats.alphaVantage) localStorage.setItem('portfolioPilotAlphaVantageUsage', backupData.data.usageStats.alphaVantage);
                if (backupData.data.usageStats.coinGecko) localStorage.setItem('portfolioPilotCoinGeckoUsage', backupData.data.usageStats.coinGecko);
                if (backupData.data.usageStats.finnhub) localStorage.setItem('portfolioPilotFinnhubUsage', backupData.data.usageStats.finnhub);
                if (backupData.data.usageStats.coinMarketCal) localStorage.setItem('portfolioPilotCoinMarketCalUsage', backupData.data.usageStats.coinMarketCal);
            }
            
            showNotification('Complete portfolio data restored successfully! Reloading page...', 'success');
            
            // Reload the page to apply the restored data
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            showNotification('Error restoring backup. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadExchangeRate();
    loadPriceCache();
    
    // Ensure exchange rate labels are properly initialized
    resetExchangeRateLabels();
    updateExchangeRateLabel();
    
    // Set up common event listeners
    const fetchRatesBtn = document.getElementById('fetch-rates-btn');
    if (fetchRatesBtn) {
        fetchRatesBtn.addEventListener('click', async () => {
            showNotification('Updating all data...', 'info');
            
            // Update exchange rates
            const ratesSuccess = await fetchExchangeRate();
            if (ratesSuccess) {
                showNotification('Exchange rates updated successfully!', 'success');
            } else {
                showNotification('Failed to update exchange rates', 'error');
            }
            
            // Update all asset prices with detailed feedback
            const results = await fetchAllAssetPrices();
            if (results) {
                // Show individual results for each asset class
                if (results.stocks.total > 0) {
                    const stockMessage = `Stocks: ${results.stocks.success}/${results.stocks.total} updated`;
                    showNotification(stockMessage, results.stocks.failed === 0 ? 'success' : 'warning');
                }
                if (results.etfs.total > 0) {
                    const etfMessage = `ETFs: ${results.etfs.success}/${results.etfs.total} updated`;
                    showNotification(etfMessage, results.etfs.failed === 0 ? 'success' : 'warning');
                }
                if (results.crypto.total > 0) {
                    const cryptoMessage = `Crypto: ${results.crypto.success}/${results.crypto.total} updated`;
                    showNotification(cryptoMessage, results.crypto.failed === 0 ? 'success' : 'warning');
                }
                
                // Trigger page refresh to show updated prices
                setTimeout(() => {
                    if (typeof loadStocks === 'function') loadStocks();
                    if (typeof loadETFs === 'function') loadETFs();
                    if (typeof loadCrypto === 'function') loadCrypto();
                }, 1000);
            } else {
                console.error('fetchAllAssetPrices returned false - check above logs for details');
                showNotification('Error updating asset prices. Check console for details.', 'error');
            }
        });
    }
    
    // Backup/Restore functionality
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const backupImport = document.getElementById('backup-import');
    
    if (backupBtn) {
        backupBtn.addEventListener('click', exportAllData);
    }
    
    if (restoreBtn && backupImport) {
        restoreBtn.addEventListener('click', () => backupImport.click());
        backupImport.addEventListener('change', importAllData);
    }
    
    const deleteStorageBtn = document.getElementById('delete-storage-btn');
    if (deleteStorageBtn) {
        deleteStorageBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all portfolio data? This will preserve your API keys and database configuration. This action cannot be undone.')) {
                // Get list of keys to preserve
                const keysToPreserve = ['apiKeys', 'assetflow_database_config', 'assetflow_user_id', 'assetflow_theme'];
                const preservedData = {};
                
                // Store data temporarily (API keys and DB config are encrypted, others are plain)
                keysToPreserve.forEach(key => {
                    const value = localStorage.getItem(key);
                    if (value) {
                        preservedData[key] = value;
                    }
                });
                
                // Clear all localStorage
                localStorage.clear();
                
                // Restore preserved data
                Object.entries(preservedData).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                });
                
                location.reload();
            }
        });
    }
});

// Stock earnings caching functions
function setCachedStockEarnings(symbol, earningsData) {
    try {
        const cached = getCachedStockEarnings();
        cached[symbol] = {
            data: earningsData,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotStockEarnings', JSON.stringify(cached));
    } catch (e) {
        console.error('Error caching stock earnings:', e);
    }
}

function getCachedStockEarnings() {
    try {
        const cached = localStorage.getItem('portfolioPilotStockEarnings');
        return cached ? JSON.parse(cached) : {};
    } catch (e) {
        return {};
    }
}

function getCachedStockEarningsForSymbol(symbol) {
    try {
        const cached = getCachedStockEarnings();
        const symbolData = cached[symbol];
        if (symbolData && symbolData.timestamp && Date.now() - symbolData.timestamp < 1000 * 60 * 60 * 24) { // 24 hours
            return symbolData.data;
        }
    } catch (e) {
        console.error('Error getting cached stock earnings:', e);
    }
    return null;
}

// Finnhub API functions
async function fetchStockEarnings(symbol) {
    const apiKey = getApiKey('Finnhub');
    if (!apiKey) {
        console.warn('Finnhub API key not configured');
        return null;
    }
    
    try {
        trackApiUsage('Finnhub');
        
        // Set date range for next 3 months to get upcoming earnings
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(today.getMonth() + 3); // 3 months from now
        
        const fromDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const toDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the earnings data
        setCachedStockEarnings(symbol, data);
        
        return data;
    } catch (error) {
        console.error(`Error fetching earnings for ${symbol}:`, error);
        return null;
    }
}

// Get API key for use in other parts of the app
function getApiKey(apiName) {
    const config = getEncryptedItem(`portfolioPilot${apiName}`);
    if (config) {
        const parsed = JSON.parse(config);
        return parsed.apiKey;
    }
    return null;
}

// Track API usage (called from other parts of the app)
function trackApiUsage(apiName) {
    const today = new Date().toDateString();
    const storageKey = `portfolioPilot${apiName}Usage`;
    const usageData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    usageData[today] = (usageData[today] || 0) + 1;
    localStorage.setItem(storageKey, JSON.stringify(usageData));
}

// Crypto events caching functions
function setCachedCryptoEvents(coins, eventsData) {
    try {
        const cached = getCachedCryptoEvents();
        const cacheKey = coins.length > 0 ? coins.sort().join(',') : 'all';
        cached[cacheKey] = {
            data: eventsData,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotCryptoEvents', JSON.stringify(cached));
    } catch (e) {
        console.error('Error caching crypto events:', e);
    }
}

function getCachedCryptoEvents() {
    try {
        const cached = localStorage.getItem('portfolioPilotCryptoEvents');
        return cached ? JSON.parse(cached) : {};
    } catch (e) {
        return {};
    }
}

function getCachedCryptoEventsForCoins(coins) {
    try {
        const cached = getCachedCryptoEvents();
        const cacheKey = coins.length > 0 ? coins.sort().join(',') : 'all';
        const coinData = cached[cacheKey];
        if (coinData && coinData.timestamp && Date.now() - coinData.timestamp < 1000 * 60 * 60 * 24) { // 24 hours
            return coinData.data;
        }
    } catch (e) {
        console.error('Error getting cached crypto events:', e);
    }
    return null;
}

// CoinMarketCal API functions
async function fetchCryptoEvents(coins = [], maxEvents = 20) {
    const apiKey = getApiKey('CoinMarketCal');
    if (!apiKey) {
        console.warn('CoinMarketCal API key not configured');
        return null;
    }
    
    try {
        trackApiUsage('CoinMarketCal');
        
        // Set date range for next 3 months
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(today.getMonth() + 3);
        
        const dateRangeStart = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dateRangeEnd = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Build query parameters
        const params = new URLSearchParams({
            page: '1',
            max: maxEvents.toString(),
            dateRangeStart: dateRangeStart,
            dateRangeEnd: dateRangeEnd,
            sortBy: 'created_desc',
            showViews: 'true',
            showVotes: 'true'
        });
        
        // Add coins parameter if provided
        if (coins.length > 0) {
            params.append('coins', coins.join(','));
        }
        
        const apiUrl = `https://developers.coinmarketcal.com/v1/events?${params.toString()}`;
        // Use a CORS proxy that can handle custom headers
        const url = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(url, {
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json',
                'Accept-Encoding': 'deflate, gzip'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the events data
        setCachedCryptoEvents(coins, data);
        
        return data;
    } catch (error) {
        console.error('Error fetching crypto events:', error);
        return null;
    }
}

// Update status tracking functions
function setUpdateStatus(assetType, status) {
    try {
        const updateStatuses = getUpdateStatuses();
        updateStatuses[assetType] = {
            status: status,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotUpdateStatuses', JSON.stringify(updateStatuses));
    } catch (e) {
        console.error('Error setting update status:', e);
    }
}

function getUpdateStatuses() {
    try {
        const statuses = localStorage.getItem('portfolioPilotUpdateStatuses');
        return statuses ? JSON.parse(statuses) : {};
    } catch (e) {
        return {};
    }
}

// Recalculate portfolio from transactions (source of truth)
function calculatePortfolioFromTransactions() {
    // Reset portfolio holdings
    portfolio.stocks = [];
    portfolio.etfs = [];
    portfolio.crypto = [];

    // Get all transactions
    const transactions = loadTransactions();

    // Group transactions by asset type and symbol
    const holdings = {
        stocks: {},
        etfs: {},
        crypto: {}
    };

    // Process each transaction
    transactions.forEach(tx => {
        if (tx.assetType === 'stocks' || tx.assetType === 'etfs' || tx.assetType === 'crypto') {
            const assetType = tx.assetType;
            const symbol = tx.symbol;

            // Ensure the asset type exists in holdings
            if (!holdings[assetType]) {
                holdings[assetType] = {};
            }

            if (!holdings[assetType][symbol]) {
                holdings[assetType][symbol] = {
                    symbol: symbol,
                    quantity: 0,
                    totalCost: 0,
                    transactions: []
                };
            }

            const holding = holdings[assetType][symbol];

            if (tx.type === 'buy') {
                holding.quantity += tx.quantity;
                holding.totalCost += tx.total;
            } else if (tx.type === 'sell') {
                // Reduce totalCost proportionally based on average cost per share
                if (holding.quantity > 0) {
                    const costToRemove = holding.totalCost * (tx.quantity / holding.quantity);
                    holding.totalCost -= costToRemove;
                }
                holding.quantity -= tx.quantity;
            }

            holding.transactions.push(tx);
        }
    });

    // Convert holdings to portfolio format
    Object.keys(holdings).forEach(assetType => {
        Object.keys(holdings[assetType]).forEach(symbol => {
            const holding = holdings[assetType][symbol];

            // Only include assets with positive quantity
            if (holding.quantity > 0) {
                const averagePrice = holding.totalCost / holding.quantity;

                const asset = {
                    id: Date.now() + Math.random(), // Generate new ID
                    name: symbol,
                    quantity: holding.quantity,
                    purchasePrice: averagePrice,
                    currency: 'EUR' // Default currency
                };

                // Ensure portfolio[assetType] exists and is an array
                if (!portfolio[assetType]) {
                    portfolio[assetType] = [];
                }
                
                portfolio[assetType].push(asset);
            }
        });
    });

    // Save the updated portfolio
    saveData();

    // Recalculate total value
    calculateTotalValue();
}

// Export functions for use in other files
window.fetchStockEarnings = fetchStockEarnings;
window.fetchCryptoEvents = fetchCryptoEvents;
window.getApiKey = getApiKey;

// Auto-calculation utility function for price/total fields
function setupAutoCalculation(quantityId, priceId, totalId) {
    const quantityInput = document.getElementById(quantityId);
    const priceInput = document.getElementById(priceId);
    const totalInput = document.getElementById(totalId);
    
    if (!quantityInput || !priceInput || !totalInput) return;
    
    const calculatePriceFromTotal = () => {
        const quantity = parseFloat(quantityInput.value) || 0;
        const total = parseFloat(totalInput.value) || 0;
        
        if (quantity > 0 && total > 0) {
            priceInput.value = (total / quantity).toFixed(2);
        }
    };
    
    const calculateTotalFromPrice = () => {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        if (quantity > 0 && price > 0) {
            totalInput.value = (quantity * price).toFixed(2);
        }
    };
    
    // When price changes, calculate total
    priceInput.addEventListener('input', calculateTotalFromPrice);
    
    // When total changes, calculate price
    totalInput.addEventListener('input', calculatePriceFromTotal);
    
    // When quantity changes, recalculate based on which field has a value
    quantityInput.addEventListener('input', () => {
        const price = parseFloat(priceInput.value) || 0;
        const total = parseFloat(totalInput.value) || 0;
        
        if (price > 0) {
            calculateTotalFromPrice();
        } else if (total > 0) {
            calculatePriceFromTotal();
        }
    });
}

window.setupAutoCalculation = setupAutoCalculation;

// Utility function to create transaction with proper currency conversion and original price storage
async function createTransactionWithCurrencyConversion(transactionData, currency, transactionDate = null) {
    const { type, assetType, symbol, quantity, finalPrice, finalTotal, date, note } = transactionData;
    
    // Use transaction date or current date
    const txDate = transactionDate || new Date(date);
    
    // Convert to EUR if needed using historical rate
    let priceInEur = finalPrice;
    let totalInEur = finalTotal;
    let historicalRate = eurUsdRate;
    
    if (currency === 'USD') {
        // Fetch historical rate for the transaction date
        historicalRate = await fetchHistoricalExchangeRate(txDate);
        priceInEur = finalPrice / historicalRate;
        totalInEur = finalTotal / historicalRate;
    }
    
    return {
        id: Date.now().toString(),
        type,
        assetType,
        symbol,
        quantity,
        price: priceInEur,
        total: totalInEur,
        currency: 'EUR',
        originalPrice: currency === 'USD' ? finalPrice : null,
        originalCurrency: currency === 'USD' ? 'USD' : null,
        historicalRate: currency === 'USD' ? historicalRate : null,
        date,
        note: note || `${type === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${assetType === 'crypto' ? 'units' : 'shares'} of ${symbol} at €${priceInEur.toFixed(2)} per ${assetType === 'crypto' ? 'unit' : 'share'}`,
        timestamp: new Date().toISOString()
    };
}

window.createTransactionWithCurrencyConversion = createTransactionWithCurrencyConversion;

// Enhanced encryption/decryption for sensitive data storage
// Uses a more secure approach with salt and better key derivation
// Note: For production apps, consider using Web Crypto API or server-side encryption
function encryptData(data) {
    if (!data) return data;
    
    try {
        // Generate a unique salt for this encryption
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
        
        // Create a more secure key using the base key + salt
        const baseKey = 'assetflow_encryption_key_2024_secure';
        const key = baseKey + saltHex;
        
        // Encrypt using XOR with the derived key
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        // Combine salt + encrypted data and base64 encode
        const combined = saltHex + encrypted;
        // Use a more robust encoding method that handles all characters
        return btoa(unescape(encodeURIComponent(combined)));
    } catch (error) {
        console.warn('Encryption failed, storing as-is:', error);
        return data; // Fallback to unencrypted storage
    }
}

function decryptData(encryptedData) {
    if (!encryptedData) return encryptedData;
    
    // Check if data looks like it's encrypted (starts with valid base64 and has minimum length)
    if (typeof encryptedData !== 'string' || encryptedData.length < 50) {
        return encryptedData; // Likely not encrypted
    }
    
    try {
        // Base64 decode with proper handling of all characters
        const decoded = decodeURIComponent(escape(atob(encryptedData)));
        
        // Check if decoded data has minimum length for salt + encrypted content
        if (decoded.length < 32) {
            return encryptedData; // Not encrypted
        }
        
        // Extract salt (first 32 characters)
        const saltHex = decoded.substring(0, 32);
        const encrypted = decoded.substring(32);
        
        // Validate salt format (should be 32 hex characters)
        if (!/^[0-9a-fA-F]{32}$/.test(saltHex)) {
            return encryptedData; // Not encrypted
        }
        
        // Recreate the key using the same salt
        const baseKey = 'assetflow_encryption_key_2024_secure';
        const key = baseKey + saltHex;
        
        // Decrypt using XOR with the derived key
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return decrypted;
    } catch (error) {
        // Silently return original data if decryption fails (likely not encrypted)
        return encryptedData;
    }
}

// Keep original localStorage methods for normal data
const originalSetItem = localStorage.setItem;
const originalGetItem = localStorage.getItem;

window.encryptData = encryptData;
window.decryptData = decryptData;
window.trackApiUsage = trackApiUsage;
window.fetchBenchmarkDataForDate = fetchBenchmarkDataForDate;
window.setCachedBenchmarkDataForDate = setCachedBenchmarkDataForDate;
window.getCachedBenchmarkDataForDate = getCachedBenchmarkDataForDate;
window.getCachedStockEarningsForSymbol = getCachedStockEarningsForSymbol;
window.getCachedStockEarnings = getCachedStockEarnings;
window.getCachedCryptoEventsForCoins = getCachedCryptoEventsForCoins;
window.getCachedCryptoEvents = getCachedCryptoEvents;
window.getUpdateStatuses = getUpdateStatuses;
window.calculatePortfolioFromTransactions = calculatePortfolioFromTransactions;

// Explicit encryption wrapper functions for sensitive data
window.setEncryptedItem = function(key, value) {
    // This function explicitly encrypts sensitive data before storage
    // Use this for API keys, database credentials, and other sensitive information
    const encryptedValue = encryptData(value);
    return originalSetItem.call(localStorage, key, encryptedValue);
};

window.getEncryptedItem = function(key) {
    // This function explicitly decrypts sensitive data after retrieval
    // Use this for API keys, database credentials, and other sensitive information
    const encryptedValue = originalGetItem.call(localStorage, key);
    return encryptedValue ? decryptData(encryptedValue) : null;
};
