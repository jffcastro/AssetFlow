// Shared functionality for Portfolio Dashboard
// This file contains common functions used across all pages

// --- STATE MANAGEMENT ---
let portfolio = {
    stocks: [],
    etfs: [],
    crypto: [],
    static: [], // Each static asset: { id, name, type, values: [{date, value, currency}] }
    cs2: { value: 0, currency: 'EUR' }
};

let eurUsdRate = 1.0;
let priceCache = { stocks: {}, crypto: {}, etfs: {} };

// Using full cryptocurrency names directly for CoinGecko API

// --- DATA PERSISTENCE ---
function loadData() {
    try {
        const data = localStorage.getItem('portfolioPilotData');
        if (data) {
            const parsed = JSON.parse(data);
            portfolio = { ...portfolio, ...parsed };
        }
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
    if (stored) {
        eurUsdRate = parseFloat(stored);
    }
    updateExchangeRateLabel();
}

function saveExchangeRate(rate) {
    eurUsdRate = rate;
    localStorage.setItem('eurUsdRate', rate);
    updateExchangeRateLabel();
}

function updateExchangeRateLabel() {
    const eurUsdLabel = document.getElementById('eur-usd-rate-label');
    const eurBtcLabel = document.getElementById('eur-btc-rate-label');
    const eurEthLabel = document.getElementById('eur-eth-rate-label');
    
    if (eurUsdLabel) {
        eurUsdLabel.textContent = `EUR/USD: ${eurUsdRate.toFixed(4)}`;
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
        
        return {
            price: currentPrice,
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
        // Fetch EUR/USD rate from Frankfurter
        const eurUsdRes = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
        const eurUsdData = await eurUsdRes.json();
        
        if (eurUsdData && eurUsdData.rates && eurUsdData.rates.USD) {
            saveExchangeRate(eurUsdData.rates.USD);
        } else {
            console.error('Failed to fetch EUR/USD rate');
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
        const price = (priceCache.stocks && priceCache.stocks[stock.name]) || 0;
        let value = price * stock.quantity;
        if (stock.currency === 'USD') value = value / eurUsdRate;
        totalValue += value;
    });
    
    // Calculate ETFs value
    portfolio.etfs.forEach(etf => {
        const price = (priceCache.etfs && priceCache.etfs[etf.name]) || 0;
        let value = price * etf.quantity;
        if (etf.currency === 'USD') value = value / eurUsdRate;
        totalValue += value;
    });
    
    // Calculate crypto value
    portfolio.crypto.forEach(crypto => {
        const price = (priceCache.crypto && priceCache.crypto[crypto.name]) || 0;
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
                    yahooFinance: localStorage.getItem('portfolioPilotYahooFinance') ? '***CONFIGURED***' : null,
                    alphaVantage: localStorage.getItem('portfolioPilotAlphaVantage') ? '***CONFIGURED***' : null,
                    coinGecko: localStorage.getItem('portfolioPilotCoinGecko') ? '***CONFIGURED***' : null,
                    finnhub: localStorage.getItem('portfolioPilotFinnhub') ? '***CONFIGURED***' : null,
                    coinMarketCal: localStorage.getItem('portfolioPilotCoinMarketCal') ? '***CONFIGURED***' : null
                },
                
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
                // Save important settings before clearing
                const apiKeys = localStorage.getItem('apiKeys');
                const databaseConfig = localStorage.getItem('assetflow_database_config');
                const userId = localStorage.getItem('assetflow_user_id');
                const theme = localStorage.getItem('assetflow_theme');
                
                // Clear all localStorage
                localStorage.clear();
                
                // Restore important settings
                if (apiKeys) localStorage.setItem('apiKeys', apiKeys);
                if (databaseConfig) localStorage.setItem('assetflow_database_config', databaseConfig);
                if (userId) localStorage.setItem('assetflow_user_id', userId);
                if (theme) localStorage.setItem('assetflow_theme', theme);
                
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
    const config = localStorage.getItem(`portfolioPilot${apiName}`);
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
        const url = `https://cors-anywhere.herokuapp.com/${apiUrl}`;
        
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
function createTransactionWithCurrencyConversion(transactionData, currency, eurUsdRate) {
    const { type, assetType, symbol, quantity, finalPrice, finalTotal, date, note } = transactionData;
    
    // Convert to EUR if needed
    let priceInEur = finalPrice;
    let totalInEur = finalTotal;
    if (currency === 'USD') {
        priceInEur = finalPrice / eurUsdRate;
        totalInEur = finalTotal / eurUsdRate;
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
        return btoa(combined);
    } catch (error) {
        console.warn('Encryption failed, storing as-is:', error);
        return data; // Fallback to unencrypted storage
    }
}

function decryptData(encryptedData) {
    if (!encryptedData) return encryptedData;
    
    try {
        // Base64 decode
        const decoded = atob(encryptedData);
        
        // Extract salt (first 32 characters)
        const saltHex = decoded.substring(0, 32);
        const encrypted = decoded.substring(32);
        
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
        console.warn('Failed to decrypt data, returning as-is:', error);
        return encryptedData; // Return original if decryption fails
    }
}

// Override localStorage methods to automatically encrypt ALL data
const originalSetItem = localStorage.setItem;
const originalGetItem = localStorage.getItem;

localStorage.setItem = function(key, value) {
    // Encrypt ALL data before storing
    return originalSetItem.call(this, key, encryptData(value));
};

localStorage.getItem = function(key) {
    const value = originalGetItem.call(this, key);
    // Decrypt ALL data when retrieving
    return decryptData(value);
};

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
