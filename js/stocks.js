// Stocks page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const stockModal = document.getElementById('stock-modal');
    const stockForm = document.getElementById('stock-form');
    const stockCancelBtn = document.getElementById('stock-cancel-btn');
    const stockModalTitle = document.getElementById('stock-modal-title');
    // Price update button removed - handled automatically from dashboard
    
    const stockIdInput = document.getElementById('stock-id');
    const stockNameInput = document.getElementById('stock-name');
    const stockQuantityInput = document.getElementById('stock-quantity');
    const stockPurchasePriceInput = document.getElementById('stock-purchase-price');
    const stockCurrencySelect = document.getElementById('stock-currency');
    const stocksTbody = document.getElementById('stocks-tbody');
    
    // Buy/Sell DOM elements
    const buyStockBtn = document.getElementById('buy-stock-btn');
    const sellStockBtn = document.getElementById('sell-stock-btn');
    const buyStockModal = document.getElementById('buy-stock-modal');
    const sellStockModal = document.getElementById('sell-stock-modal');
    const buyStockForm = document.getElementById('buy-stock-form');
    const sellStockForm = document.getElementById('sell-stock-form');
    const buyStockCancelBtn = document.getElementById('buy-stock-cancel-btn');
    const sellStockCancelBtn = document.getElementById('sell-stock-cancel-btn');
    const sellStockSymbolSelect = document.getElementById('sell-stock-symbol');
    const refreshTransactionsBtn = document.getElementById('refresh-transactions-btn');
    const refreshEventsBtn = document.getElementById('refresh-events-btn');
    const stockTransactionsFilter = document.getElementById('stock-transactions-filter');

    // Event listeners
    stockCancelBtn.addEventListener('click', closeStockModal);
    stockModal.addEventListener('click', (e) => {
        if (e.target === stockModal) closeStockModal();
    });
    
    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveStock();
    });

    // Buy/Sell event listeners
    buyStockBtn.addEventListener('click', openBuyStockModal);
    sellStockBtn.addEventListener('click', openSellStockModal);
    buyStockCancelBtn.addEventListener('click', closeBuyStockModal);
    sellStockCancelBtn.addEventListener('click', closeSellStockModal);
    buyStockModal.addEventListener('click', (e) => {
        if (e.target === buyStockModal) closeBuyStockModal();
    });
    sellStockModal.addEventListener('click', (e) => {
        if (e.target === sellStockModal) closeSellStockModal();
    });
    
    buyStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleBuyStock();
    });
    
    sellStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSellStock();
    });
    
    refreshTransactionsBtn.addEventListener('click', renderStockTransactions);
    refreshEventsBtn.addEventListener('click', loadStockEvents);
    stockTransactionsFilter.addEventListener('input', filterStockTransactions);
    
    // Set up auto-calculation for buy form
    setupAutoCalculation('buy-stock-quantity', 'buy-stock-price', 'buy-stock-total');
    
    // Set up auto-calculation for sell form
    setupAutoCalculation('sell-stock-quantity', 'sell-stock-price', 'sell-stock-total');
    
    // Price updates are now handled automatically from the dashboard
    
    // Initial render
    renderStocks();
    loadStockEvents();
    
    // Sold Assets functionality
    const toggleSoldAssetsBtn = document.getElementById('toggle-sold-assets-btn');
    const refreshSoldAssetsBtn = document.getElementById('refresh-sold-assets-btn');
    const soldAssetsContainer = document.getElementById('sold-assets-container');
    const soldAssetsToggleText = document.getElementById('sold-assets-toggle-text');
    
    let soldAssetsVisible = false;
    
    toggleSoldAssetsBtn.addEventListener('click', async () => {
        soldAssetsVisible = !soldAssetsVisible;
        
        if (soldAssetsVisible) {
            soldAssetsContainer.classList.remove('hidden');
            soldAssetsToggleText.textContent = 'Hide';
            refreshSoldAssetsBtn.style.display = 'inline-block';
            await renderSoldAssets();
        } else {
            soldAssetsContainer.classList.add('hidden');
            soldAssetsToggleText.textContent = 'Show';
            refreshSoldAssetsBtn.style.display = 'none';
        }
    });
    
    refreshSoldAssetsBtn.addEventListener('click', async () => {
        await renderSoldAssets();
    });
});

function openStockModal(mode = 'add', stock = null) {
    const stockForm = document.getElementById('stock-form');
    const stockModalTitle = document.getElementById('stock-modal-title');
    const stockIdInput = document.getElementById('stock-id');
    const stockNameInput = document.getElementById('stock-name');
    const stockQuantityInput = document.getElementById('stock-quantity');
    const stockPurchasePriceInput = document.getElementById('stock-purchase-price');
    const stockCurrencySelect = document.getElementById('stock-currency');
    
    stockForm.reset();
    stockModalTitle.textContent = mode === 'add' ? 'Add New Stock' : 'Edit Stock';
    stockIdInput.value = stock ? stock.id : '';
    
    if (stock) {
        stockNameInput.value = stock.name;
        stockQuantityInput.value = stock.quantity;
        stockPurchasePriceInput.value = stock.purchasePrice;
        stockCurrencySelect.value = stock.currency;
    } else {
        stockCurrencySelect.value = 'EUR';
    }
    
    document.getElementById('stock-modal').classList.remove('hidden');
}

function closeStockModal() {
    document.getElementById('stock-modal').classList.add('hidden');
}

function saveStock() {
    const stockIdInput = document.getElementById('stock-id');
    const stockNameInput = document.getElementById('stock-name');
    const stockQuantityInput = document.getElementById('stock-quantity');
    const stockPurchasePriceInput = document.getElementById('stock-purchase-price');
    const stockCurrencySelect = document.getElementById('stock-currency');
    
    const stockData = {
        id: stockIdInput.value ? parseInt(stockIdInput.value) : Date.now(),
        name: stockNameInput.value.toUpperCase(),
        quantity: parseFloat(stockQuantityInput.value),
        purchasePrice: parseFloat(stockPurchasePriceInput.value),
        currency: stockCurrencySelect.value
    };
    
    if (stockIdInput.value) {
        // Edit existing stock
        const index = portfolio.stocks.findIndex(s => s.id == stockIdInput.value);
        if (index !== -1) {
            portfolio.stocks[index] = stockData;
        }
    } else {
        // Add new stock
        portfolio.stocks.push(stockData);
    }
    
    saveData();
    renderStocks();
    closeStockModal();
    showNotification('Stock saved successfully!', 'success');
}

function deleteStock(id) {
    if (confirm('Are you sure you want to delete this stock? This will also remove all associated transactions from the transaction history.')) {
        // Find the stock to get its symbol
        const stock = portfolio.stocks.find(s => s.id == id);
        if (!stock) {
            showNotification('Stock not found', 'error');
            return;
        }
        
        // Remove all transactions for this stock
        const transactions = loadTransactions();
        console.log('Before deletion - transactions count:', transactions.length);
        console.log('Stock to delete:', stock);
        console.log('All transactions:', transactions);
        
        // Filter out transactions for this stock
        const updatedTransactions = transactions.filter(tx => {
            const isStockTransaction = tx.assetType === 'stocks';
            const isSameSymbol = tx.symbol === stock.name; // Use stock.name instead of stock.symbol
            const shouldRemove = isStockTransaction && isSameSymbol;
            
            console.log(`Transaction ${tx.id}: assetType=${tx.assetType}, symbol=${tx.symbol}, stockName=${stock.name}, isStockTransaction=${isStockTransaction}, isSameSymbol=${isSameSymbol}, shouldRemove=${shouldRemove}`);
            
            return !shouldRemove;
        });
        
        console.log('After deletion - transactions count:', updatedTransactions.length);
        saveTransactions(updatedTransactions);
        
        // Remove the stock from portfolio
        portfolio.stocks = portfolio.stocks.filter(s => s.id != id);
        saveData();
        
        // Recalculate portfolio from transactions (source of truth)
        console.log('Recalculating portfolio from transactions...');
        calculatePortfolioFromTransactions();
        console.log('Portfolio after recalculation:', portfolio);
        renderStocks();
        renderStockTransactions(); // Refresh transaction history
        showNotification('Stock and all associated transactions deleted successfully!', 'success');
    }
}

function renderStocks() {
    const stocksTbody = document.getElementById('stocks-tbody');
    const stocksCount = document.getElementById('stocks-count');
    if (!stocksTbody) return;
    
    console.log('Rendering stocks. Portfolio stocks:', portfolio.stocks);
    
    // Update count
    if (stocksCount) {
        stocksCount.textContent = portfolio.stocks.length;
    }
    
    if (portfolio.stocks.length === 0) {
        stocksTbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-gray-400">No stocks added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    let totalPnl = 0;
    
    // First pass: calculate total values
    portfolio.stocks.forEach(stock => {
        const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
        const currentPrice = cachedData.price || 0; // Price is already in EUR
        const value = currentPrice * stock.quantity;
        const purchaseValue = stock.purchasePrice * stock.quantity;
        const pnl = value - purchaseValue;
        
        totalValue += value;
        totalPnl += pnl;
    });
    
    // Second pass: render rows with allocation percentages
    portfolio.stocks.forEach(stock => {
        const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
        const currentPrice = cachedData.price || 0; // Price is already in EUR
        const change24h = cachedData.change24h || 0;
        const value = currentPrice * stock.quantity;
        const purchaseValue = stock.purchasePrice * stock.quantity;
        const pnl = value - purchaseValue;
        const pnlPercentage = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
        
        const pnlClass = pnl >= 0 ? 'positive-gain' : 'negative-gain';
        const pnlSign = pnl >= 0 ? '+' : '';
        
        // Calculate allocation percentage
        const allocationPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        
        // Format 24h change
        const change24hClass = change24h >= 0 ? 'text-emerald-400' : 'text-red-400';
        const change24hSign = change24h >= 0 ? '+' : '';
        const change24hDisplay = currentPrice > 0 ? `${change24hSign}${change24h.toFixed(2)}%` : '--';
        
        // Format value with color coding (green if current value > purchase value, red if lower)
        const valueClass = value >= purchaseValue ? 'positive-gain' : 'negative-gain';
        
        // Calculate holding time
        const transactions = loadTransactions();
        const holdingTime = calculateHoldingTime(transactions, 'stocks', stock.name);
        const holdingTimeDisplay = holdingTime ? 
            `${holdingTime.years > 0 ? holdingTime.years + 'y ' : ''}${holdingTime.months > 0 ? holdingTime.months + 'm ' : ''}${holdingTime.daysRemainder}d` : 
            '--';
        
        // Calculate realized P&L for this stock
        const realizedPnL = calculateRealizedPnL(transactions);
        const stockRealizedPnL = realizedPnL.byAsset[`stocks-${stock.name}`] || 0;
        const realizedPnLDisplay = stockRealizedPnL !== 0 ? formatCurrency(stockRealizedPnL, 'EUR') : '--';
        const realizedPnLClass = stockRealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 font-semibold">
                    <a href="https://finance.yahoo.com/quote/${stock.name}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">
                        ${stock.name}
                    </a>
                </td>
                <td class="py-2 px-2">${stock.quantity}</td>
                <td class="py-2 px-2">${formatCurrency(stock.purchasePrice, stock.currency)}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(currentPrice, 'EUR') : '--'}</td>
                <td class="py-2 px-2 ${change24hClass}">${change24hDisplay}</td>
                <td class="py-2 px-2 ${valueClass}">${currentPrice > 0 ? formatCurrency(value, stock.currency) : '--'}</td>
                <td class="py-2 px-2">${allocationPercentage.toFixed(1)}%</td>
                <td class="py-2 px-2 ${pnlClass}">
                    ${currentPrice > 0 ? `${pnlSign}${formatCurrency(pnl, stock.currency)} (${pnlSign}${pnlPercentage.toFixed(2)}%)` : '--'}
                </td>
                <td class="py-2 px-2 ${realizedPnLClass}">${realizedPnLDisplay}</td>
                <td class="py-2 px-2 text-gray-300">${holdingTimeDisplay}</td>
                <td class="py-2 px-2">
                    <button onclick="deleteStock(${stock.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Add total row
    if (portfolio.stocks.length > 0) {
        const totalPnlClass = totalPnl >= 0 ? 'positive-gain' : 'negative-gain';
        const totalPnlSign = totalPnl >= 0 ? '+' : '';
        const totalPnlPercentage = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
        
        html += `
            <tr class="border-t-2 border-emerald-500 bg-gray-900">
                <td colspan="4" class="py-2 px-2 font-bold text-emerald-300">Total</td>
                <td class="py-2 px-2 font-bold text-emerald-300">--</td>
                <td class="py-2 px-2 font-bold ${totalPnlClass}">${formatCurrency(totalValue, 'EUR')}</td>
                <td class="py-2 px-2 font-bold text-emerald-300">100.0%</td>
                <td class="py-2 px-2 font-bold ${totalPnlClass}">
                    ${totalPnlSign}${formatCurrency(totalPnl, 'EUR')} (${totalPnlSign}${totalPnlPercentage.toFixed(2)}%)
                </td>
                <td class="py-2 px-2 font-bold text-emerald-300">--</td>
                <td class="py-2 px-2 font-bold text-emerald-300">--</td>
                <td class="py-2 px-2"></td>
            </tr>
        `;
    }
    
    stocksTbody.innerHTML = html;
    
    // Update realized P&L display
    updateRealizedPnLDisplay();
}

function updateRealizedPnLDisplay() {
    const transactions = loadTransactions();
    const realizedPnL = calculateRealizedPnL(transactions);
    
    // Update individual asset type P&L
    const stocksElement = document.getElementById('stocks-realized-pnl');
    const etfsElement = document.getElementById('etfs-realized-pnl');
    const cryptoElement = document.getElementById('crypto-realized-pnl');
    const totalElement = document.getElementById('total-realized-pnl');
    
    if (stocksElement) {
        const stocksClass = realizedPnL.stocks >= 0 ? 'text-emerald-400' : 'text-red-400';
        stocksElement.className = `text-lg font-semibold ${stocksClass}`;
        stocksElement.textContent = formatCurrency(realizedPnL.stocks, 'EUR');
    }
    
    if (etfsElement) {
        const etfsClass = realizedPnL.etfs >= 0 ? 'text-emerald-400' : 'text-red-400';
        etfsElement.className = `text-lg font-semibold ${etfsClass}`;
        etfsElement.textContent = formatCurrency(realizedPnL.etfs, 'EUR');
    }
    
    if (cryptoElement) {
        const cryptoClass = realizedPnL.crypto >= 0 ? 'text-emerald-400' : 'text-red-400';
        cryptoElement.className = `text-lg font-semibold ${cryptoClass}`;
        cryptoElement.textContent = formatCurrency(realizedPnL.crypto, 'EUR');
    }
    
    if (totalElement) {
        const totalClass = realizedPnL.total >= 0 ? 'text-emerald-400' : 'text-red-400';
        totalElement.className = `text-lg font-semibold ${totalClass}`;
        totalElement.textContent = formatCurrency(realizedPnL.total, 'EUR');
    }
}

function editStock(id) {
    const stock = portfolio.stocks.find(s => s.id == id);
    if (stock) {
        openStockModal('edit', stock);
    }
}

async function updateStockPrices() {
    const getStocksPricesBtn = document.getElementById('get-stocks-prices-btn');
    if (getStocksPricesBtn) {
        getStocksPricesBtn.disabled = true;
        getStocksPricesBtn.textContent = 'Updating...';
    }
    
    let updatedCount = 0;
    const promises = portfolio.stocks.map(async (stock) => {
        try {
            const price = await fetchStockPrice(stock.name);
            if (price) {
                if (!priceCache.stocks) priceCache.stocks = {};
                priceCache.stocks[stock.name] = price;
                updatedCount++;
            }
        } catch (error) {
            console.error(`Error fetching price for ${stock.name}:`, error);
        }
    });
    
    await Promise.all(promises);
    savePriceCache();
    
    // Also update sold assets prices
    await fetchSoldAssetsPrices();
    
    renderStocks();
    
    if (getStocksPricesBtn) {
        getStocksPricesBtn.disabled = false;
        getStocksPricesBtn.textContent = 'Update Prices';
    }
    
    showNotification(`Updated prices for ${updatedCount} stocks`, 'success');
}

async function loadStockEvents() {
    const stockEventsDiv = document.getElementById('stock-events');
    if (!stockEventsDiv) return;
    
    try {
        const stockTickers = portfolio.stocks.map(stock => stock.name);
        if (stockTickers.length === 0) {
            stockEventsDiv.innerHTML = '<div class="text-gray-400">No stocks added to show events.</div>';
            return;
        }
        
        // Check if Finnhub API key is configured
        const apiKey = getApiKey('Finnhub');
        if (!apiKey) {
            stockEventsDiv.innerHTML = `
                <div class="text-yellow-400 mb-2">⚠️ Finnhub API key not configured</div>
                <div class="text-gray-400 mb-2">Configure your Finnhub API key to view earnings dates.</div>
                <div class="mt-2">
                    <a href="configurations.html" class="text-blue-400 hover:text-blue-300 underline">Configure API Keys</a>
                </div>
            `;
            return;
        }
        
        // Show loading state
        stockEventsDiv.innerHTML = '<div class="text-gray-400">Loading earnings dates...</div>';
        
        // Check for cached data first, then fetch if needed
        const earningsPromises = stockTickers.map(async (ticker) => {
            // Try to get cached data first
            let earningsData = getCachedStockEarningsForSymbol(ticker);
            
            if (!earningsData) {
                // If no cached data, fetch from API
                earningsData = await fetchStockEarnings(ticker);
            } else {
                console.log(`Using cached earnings data for ${ticker}`);
            }
            
            return { ticker, earningsData };
        });
        
        const results = await Promise.allSettled(earningsPromises);
        
        // Process results and display earnings events
        let eventsHtml = '';
        let hasEvents = false;
        let lastFetchedTime = null;
        
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.earningsData) {
                const { ticker, earningsData } = result.value;
                
                if (earningsData.earningsCalendar && earningsData.earningsCalendar.length > 0) {
                    hasEvents = true;
                    
                    // Get the timestamp from cached data if available
                    const cached = getCachedStockEarnings();
                    const symbolData = cached[ticker];
                    if (symbolData && symbolData.timestamp) {
                        lastFetchedTime = new Date(symbolData.timestamp);
                    }
                    
                    eventsHtml += `
                        <div class="mb-2 p-2 bg-gray-700 rounded">
                            <div class="flex justify-between items-center mb-1">
                                <h4 class="text-sm font-semibold text-emerald-400">${ticker}</h4>
                                ${lastFetchedTime ? `<div class="text-xs text-gray-400">${lastFetchedTime.toLocaleString()}</div>` : ''}
                            </div>
                            <div class="space-y-1">
                    `;
                    
                    earningsData.earningsCalendar.forEach(event => {
                        const eventDate = new Date(event.date);
                        const today = new Date();
                        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                        
                        // Skip past events
                        if (daysUntil < 0) {
                            return;
                        }
                        
                        let dateText = '';
                        if (daysUntil === 0) {
                            dateText = 'Today';
                        } else if (daysUntil === 1) {
                            dateText = 'Tomorrow';
                        } else {
                            dateText = `In ${daysUntil} days`;
                        }
                        
                        // Format time (amc = after market close, bmc = before market close)
                        const timeText = event.hour === 'amc' ? 'After Market Close' : 
                                        event.hour === 'bmc' ? 'Before Market Open' : 
                                        event.hour || 'TBD';
                        
                        // Format quarter info
                        const quarterText = event.quarter ? `Q${event.quarter} ${event.year}` : '';
                        
                        eventsHtml += `
                            <div class="mb-1 p-2 bg-gray-600 rounded">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs text-gray-300">Earnings Report</span>
                                    <div class="text-right">
                                        <div class="text-xs text-emerald-400 font-semibold">${eventDate.toLocaleDateString()}</div>
                                        <div class="text-xs text-gray-400">${dateText}</div>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-400">
                                    <span>${timeText}</span>
                                    ${quarterText ? `<span class="ml-2">${quarterText}</span>` : ''}
                                    ${event.epsEstimate ? `<span class="ml-2">EPS: $${event.epsEstimate.toFixed(2)}</span>` : ''}
                                    ${event.revenueEstimate ? `<span class="ml-2">Rev: $${(event.revenueEstimate / 1000000000).toFixed(1)}B</span>` : ''}
                                </div>
                            </div>
                        `;
                    });
                    
                    eventsHtml += `
                            </div>
                        </div>
                    `;
                }
            }
        });
        
        // Handle rejected promises
        const rejectedResults = results.filter(result => result.status === 'rejected');
        if (rejectedResults.length > 0) {
            console.warn('Some stock earnings requests failed:', rejectedResults);
            if (!hasEvents) {
                eventsHtml += '<div class="text-yellow-400 mb-2">⚠️ Some earnings data could not be loaded.</div>';
            }
        }
        
        if (!hasEvents) {
            eventsHtml = `
                <div class="text-gray-400 mb-2">No upcoming earnings dates found for your stocks.</div>
                <div class="mt-2">
                    <a href="https://www.finnhub.io/calendar" target="_blank" class="text-blue-400 hover:text-blue-300 underline">View Full Stock Calendar</a>
                </div>
            `;
        }
        
        stockEventsDiv.innerHTML = eventsHtml;
        
    } catch (error) {
        console.error('Error loading stock events:', error);
        stockEventsDiv.innerHTML = `
            <div class="text-red-400 mb-2">Error loading stock events.</div>
            <div class="text-gray-400 text-sm">Please check your Finnhub API key configuration.</div>
        `;
    }
}

// Notes functionality
function initializeNotes() {
    const notesTextarea = document.getElementById('stocks-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        // Load existing notes
        loadNotes();
        
        // Event listeners
        notesTextarea.addEventListener('input', () => {
            updateCharCount();
            autoSaveNotes();
        });
        
        // Auto-save on blur
        notesTextarea.addEventListener('blur', autoSaveNotes);
    }
}

function loadNotes() {
    const notesTextarea = document.getElementById('stocks-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const notes = localStorage.getItem('stocksNotes') || '';
        notesTextarea.value = notes;
        updateCharCount();
    }
}

function autoSaveNotes() {
    const notesTextarea = document.getElementById('stocks-notes');
    
    if (notesTextarea) {
        const notes = notesTextarea.value;
        localStorage.setItem('stocksNotes', notes);
    }
}

function updateCharCount() {
    const notesTextarea = document.getElementById('stocks-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const count = notesTextarea.value.length;
        charCount.textContent = count;
    }
}

// Buy/Sell functionality
function openBuyStockModal() {
    const modal = document.getElementById('buy-stock-modal');
    const dateInput = document.getElementById('buy-stock-date');
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeBuyStockModal() {
    const modal = document.getElementById('buy-stock-modal');
    modal.classList.add('hidden');
    document.getElementById('buy-stock-form').reset();
}

function openSellStockModal() {
    const modal = document.getElementById('sell-stock-modal');
    const dateInput = document.getElementById('sell-stock-date');
    const symbolSelect = document.getElementById('sell-stock-symbol');
    
    // Populate stock symbols dropdown
    symbolSelect.innerHTML = '<option value="">Select a stock to sell</option>';
    if (portfolio.stocks) {
        portfolio.stocks.forEach(stock => {
            if (stock.quantity > 0) {
                const option = document.createElement('option');
                option.value = stock.name;
                option.textContent = `${stock.name} (${stock.quantity} shares)`;
                symbolSelect.appendChild(option);
            }
        });
    }
    
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeSellStockModal() {
    const modal = document.getElementById('sell-stock-modal');
    modal.classList.add('hidden');
    document.getElementById('sell-stock-form').reset();
}


async function handleBuyStock() {
    try {
        const symbol = document.getElementById('buy-stock-symbol').value.trim().toUpperCase();
        const quantity = parseFloat(document.getElementById('buy-stock-quantity').value);
        const price = parseFloat(document.getElementById('buy-stock-price').value);
        const total = parseFloat(document.getElementById('buy-stock-total').value);
        const currency = document.getElementById('buy-stock-currency').value;
        const date = document.getElementById('buy-stock-date').value;
        const note = document.getElementById('buy-stock-note').value.trim();
        
        // Validate required fields
        if (!symbol || !quantity || !date) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate exchange rate for USD transactions
        if (currency === 'USD' && (isNaN(eurUsdRate) || eurUsdRate === 0)) {
            showNotification('Exchange rate not available. Please update rates first by clicking "Update All" on the dashboard.', 'error');
            return;
        }
        
        // Validate that either price or total is provided
        if (!price && !total) {
            showNotification('Please provide either price per share or total amount', 'error');
            return;
        }
        
        // Calculate missing value
        let finalPrice = price;
        let finalTotal = total;
        if (price && !total) {
            finalTotal = quantity * price;
        } else if (total && !price) {
            finalPrice = total / quantity;
        }
    
        // Create transaction with historical rate conversion
        const transactionData = {
            type: 'buy',
            assetType: 'stocks',
            symbol: symbol,
            quantity: quantity,
            finalPrice: finalPrice,
            finalTotal: finalTotal,
            date: date,
            note: note
        };
        
        const transaction = await createTransactionWithCurrencyConversion(transactionData, currency, new Date(date));
        addTransaction(transaction);
        saveData();
        calculatePortfolioFromTransactions();
        renderStocks();
        renderStockTransactions();
        updateRealizedPnLDisplay();
        closeBuyStockModal();
        
        showNotification(`Successfully bought ${quantity} shares of ${symbol}`, 'success');
        
    } catch (error) {
        console.error('Error in handleBuyStock:', error);
        showNotification(`Error buying stock: ${error.message}`, 'error');
    }
}

async function handleSellStock() {
    const symbol = document.getElementById('sell-stock-symbol').value;
    const quantity = parseFloat(document.getElementById('sell-stock-quantity').value);
    const price = parseFloat(document.getElementById('sell-stock-price').value);
    const total = parseFloat(document.getElementById('sell-stock-total').value);
    const currency = document.getElementById('sell-stock-currency').value;
    const date = document.getElementById('sell-stock-date').value;
    const note = document.getElementById('sell-stock-note').value.trim();
    
    // Validate required fields
    if (!symbol || !quantity || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate that either price or total is provided
    if (!price && !total) {
        showNotification('Please provide either price per share or total amount', 'error');
        return;
    }
    
    // Calculate missing value
    let finalPrice = price;
    let finalTotal = total;
    if (price && !total) {
        finalTotal = quantity * price;
    } else if (total && !price) {
        finalPrice = total / quantity;
    }
    
    // Create transaction with historical rate conversion
    const transactionData = {
        type: 'sell',
        assetType: 'stocks',
        symbol: symbol,
        quantity: quantity,
        finalPrice: finalPrice,
        finalTotal: finalTotal,
        date: date,
        note: note
    };
    
    const transaction = await createTransactionWithCurrencyConversion(transactionData, currency, new Date(date));
    addTransaction(transaction);
    saveData();
    calculatePortfolioFromTransactions();
    renderStocks();
    renderStockTransactions();
    updateRealizedPnLDisplay();
    closeSellStockModal();
    
    showNotification(`Successfully sold ${quantity} shares of ${symbol}`, 'success');
}

// Transaction history rendering
function renderStockTransactions() {
    const tbody = document.getElementById('stock-transactions-tbody');
    if (!tbody) return;
    
    const transactions = loadTransactions().filter(tx => tx.assetType === 'stocks');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-gray-400">No stock transactions yet.</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    transactions.forEach(tx => {
        const typeColor = tx.type === 'buy' ? 'text-green-400' : 'text-red-400';
        const typeText = tx.type === 'buy' ? 'Buy' : 'Sell';
        
        // Format price display with original USD if available
        let priceDisplay = formatCurrency(tx.price, 'EUR');
        if (tx.originalPrice && tx.originalCurrency === 'USD') {
            const price = tx.price || 0;
            const originalPrice = tx.originalPrice || 0;
            priceDisplay = `€${price.toFixed(2)} ($${originalPrice.toFixed(2)})`;
        }
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 text-gray-300">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="py-2 px-2 ${typeColor}">${typeText}</td>
                <td class="py-2 px-2 text-white font-medium">${tx.symbol}</td>
                <td class="py-2 px-2 text-gray-300">${tx.quantity}</td>
                <td class="py-2 px-2 text-gray-300">${priceDisplay}</td>
                <td class="py-2 px-2 text-gray-300">${formatCurrency(tx.total, 'EUR')}</td>
                <td class="py-2 px-2 text-gray-300">${tx.originalCurrency || 'EUR'}</td>
                <td class="py-2 px-2 text-gray-300">${tx.historicalRate ? tx.historicalRate.toFixed(4) : '--'}</td>
                <td class="py-2 px-2 text-gray-300">${tx.note || '-'}</td>
                <td class="py-2 px-2">
                    <div class="flex gap-1">
                        <button onclick="editStockTransaction('${tx.id}')" class="glass-button text-xs px-2 py-1" title="Edit">
                            ✏️
                        </button>
                        <button onclick="deleteStockTransaction('${tx.id}')" class="glass-button glass-button-danger text-xs px-2 py-1" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Edit stock transaction
function editStockTransaction(transactionId) {
    const transactions = loadTransactions();
    const transaction = transactions.find(tx => tx.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction not found', 'error');
        return;
    }
    
    // Populate the edit modal
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-transaction-type').value = transaction.type;
    document.getElementById('edit-transaction-symbol').value = transaction.symbol;
    document.getElementById('edit-transaction-quantity').value = transaction.quantity;
    // Set currency and price based on original currency
    if (transaction.originalCurrency === 'USD') {
        document.getElementById('edit-transaction-currency').value = 'USD';
        document.getElementById('edit-transaction-price').value = transaction.originalPrice;
        document.getElementById('edit-transaction-total').value = transaction.originalPrice * transaction.quantity;
    } else {
        document.getElementById('edit-transaction-currency').value = 'EUR';
        document.getElementById('edit-transaction-price').value = transaction.price;
        document.getElementById('edit-transaction-total').value = transaction.total;
    }
    document.getElementById('edit-transaction-date').value = transaction.date;
    document.getElementById('edit-transaction-note').value = transaction.note || '';
    
    // Show the modal
    document.getElementById('edit-stock-transaction-modal').classList.remove('hidden');
}

// Delete stock transaction
function deleteStockTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }
    
    const transactions = loadTransactions();
    const updatedTransactions = transactions.filter(tx => tx.id !== transactionId);
    saveTransactions(updatedTransactions);
    
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderStocks();
    renderStockTransactions();
    
    showNotification('Transaction deleted successfully', 'success');
}

// Handle edit transaction form submission
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-stock-transaction-form');
    const editCancelBtn = document.getElementById('edit-transaction-cancel-btn');
    
    if (editForm) {
        // Setup auto-calculation for edit form
        setupAutoCalculation('edit-transaction-quantity', 'edit-transaction-price', 'edit-transaction-total');
        
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const transactionId = document.getElementById('edit-transaction-id').value;
            const type = document.getElementById('edit-transaction-type').value;
            const symbol = document.getElementById('edit-transaction-symbol').value.toUpperCase();
            const quantity = parseFloat(document.getElementById('edit-transaction-quantity').value);
            const price = parseFloat(document.getElementById('edit-transaction-price').value);
            const total = parseFloat(document.getElementById('edit-transaction-total').value);
            const currency = document.getElementById('edit-transaction-currency').value;
            const date = document.getElementById('edit-transaction-date').value;
            const note = document.getElementById('edit-transaction-note').value.trim();
            
            if (!symbol || !quantity || !price || !total || !date) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Convert to EUR if needed using historical rate
            let priceInEur = price;
            let totalInEur = total;
            let historicalRate = null;
            if (currency === 'USD') {
                try {
                    const txDate = new Date(date);
                    historicalRate = await fetchHistoricalExchangeRate(txDate);
                    priceInEur = price / historicalRate;
                    totalInEur = total / historicalRate;
                } catch (error) {
                    console.error('Error fetching historical rate:', error);
                    showNotification('Error fetching historical exchange rate. Using current rate.', 'warning');
                    priceInEur = price / eurUsdRate;
                    totalInEur = total / eurUsdRate;
                    historicalRate = eurUsdRate;
                }
            }
            
            // Update the transaction
            const transactions = loadTransactions();
            const transactionIndex = transactions.findIndex(tx => tx.id === transactionId);
            
            if (transactionIndex === -1) {
                showNotification('Transaction not found', 'error');
                return;
            }
            
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                type,
                symbol,
                quantity,
                price: priceInEur,
                total: totalInEur,
                currency: 'EUR', // Always store in EUR
                originalPrice: currency === 'USD' ? price : null,
                originalCurrency: currency === 'USD' ? 'USD' : null,
                historicalRate: currency === 'USD' ? historicalRate : null,
                date,
                note: note || transactions[transactionIndex].note,
                timestamp: new Date().toISOString()
            };
            
            saveTransactions(transactions);
            
            // Recalculate portfolio from transactions (source of truth)
            calculatePortfolioFromTransactions();
            renderStocks();
            renderStockTransactions();
            
            // Close modal
            document.getElementById('edit-stock-transaction-modal').classList.add('hidden');
            
            showNotification('Transaction updated successfully', 'success');
        });
    }
    
    if (editCancelBtn) {
        editCancelBtn.addEventListener('click', () => {
            document.getElementById('edit-stock-transaction-modal').classList.add('hidden');
        });
    }
});

function filterStockTransactions() {
    const filterValue = document.getElementById('stock-transactions-filter').value.toLowerCase();
    const tbody = document.getElementById('stock-transactions-tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) {
            // Skip the "no transactions" row
            return;
        }
        
        const symbolCell = row.cells[2]; // Symbol column
        const noteCell = row.cells[7]; // Note column
        
        const symbol = symbolCell ? symbolCell.textContent.toLowerCase() : '';
        const note = noteCell ? noteCell.textContent.toLowerCase() : '';
        
        const matches = symbol.includes(filterValue) || note.includes(filterValue);
        row.style.display = matches ? '' : 'none';
    });
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
    renderStockTransactions();
});

// Sold Assets Analysis Functions
async function renderSoldAssets() {
    const soldAssetsTbody = document.getElementById('sold-assets-tbody');
    const soldAssetsLoading = document.getElementById('sold-assets-loading');
    const soldAssetsEmpty = document.getElementById('sold-assets-empty');
    
    if (!soldAssetsTbody) return;
    
    // Show loading state
    soldAssetsLoading.classList.remove('hidden');
    soldAssetsEmpty.classList.add('hidden');
    soldAssetsTbody.innerHTML = '';
    
    try {
        // Get sold assets analysis
        const transactions = loadTransactions();
        const soldAssets = getSoldAssetsAnalysis(transactions, 'stocks');
        
        if (soldAssets.length === 0) {
            soldAssetsLoading.classList.add('hidden');
            soldAssetsEmpty.classList.remove('hidden');
            return;
        }
        
        // Update with current prices
        const updatedAssets = updateSoldAssetsWithCurrentPrices(soldAssets, 'stocks');
        
        // Render the table
        soldAssetsTbody.innerHTML = '';
        updatedAssets.forEach(asset => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/50';
            
            const formatCurrency = (value) => {
                if (value === null || value === undefined) return '--';
                return `€${value.toFixed(2)}`;
            };
            
            const formatPnL = (value) => {
                if (value === null || value === undefined) return '--';
                const formatted = `€${Math.abs(value).toFixed(2)}`;
                return value >= 0 ? `+${formatted}` : `-${formatted}`;
            };
            
            const formatDate = (dateStr) => {
                if (dateStr.includes(' - ')) {
                    // Date range format
                    const [start, end] = dateStr.split(' - ');
                    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
                } else {
                    // Single date format
                    return new Date(dateStr).toLocaleDateString();
                }
            };
            
            row.innerHTML = `
                <td class="py-3 px-3 font-medium">${asset.symbol}</td>
                <td class="py-3 px-3">${asset.quantity}</td>
                <td class="py-3 px-3">${formatCurrency(asset.averageSellPrice)}</td>
                <td class="py-3 px-3">${formatCurrency(asset.currentPrice)}</td>
                <td class="py-3 px-3 ${asset.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}">${formatPnL(asset.realizedPnL)}</td>
                <td class="py-3 px-3 ${asset.ifHeldPnL >= 0 ? 'text-green-400' : 'text-red-400'}">${formatPnL(asset.ifHeldPnL)}</td>
                <td class="py-3 px-3 ${asset.difference >= 0 ? 'text-green-400' : 'text-red-400'}">${formatPnL(asset.difference)}</td>
                <td class="py-3 px-3 text-gray-400">${formatDate(asset.sellDate)}</td>
            `;
            
            soldAssetsTbody.appendChild(row);
        });
        
        soldAssetsLoading.classList.add('hidden');
        
    } catch (error) {
        console.error('Error rendering sold assets:', error);
        soldAssetsLoading.classList.add('hidden');
        soldAssetsTbody.innerHTML = '<tr><td colspan="8" class="text-center text-red-400 py-4">Error loading sold assets</td></tr>';
    }
}
