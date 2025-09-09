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
    
    // Set up auto-calculation for buy form
    setupAutoCalculation('buy-stock-quantity', 'buy-stock-price', 'buy-stock-total');
    setupAutoCalculation('buy-stock-quantity', 'buy-stock-total', 'buy-stock-price');
    
    // Set up auto-calculation for sell form
    setupAutoCalculation('sell-stock-quantity', 'sell-stock-price', 'sell-stock-total');
    setupAutoCalculation('sell-stock-quantity', 'sell-stock-total', 'sell-stock-price');
    
    // Price updates are now handled automatically from the dashboard
    
    // Initial render
    renderStocks();
    loadStockEvents();
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
    if (confirm('Are you sure you want to delete this stock?')) {
        portfolio.stocks = portfolio.stocks.filter(s => s.id != id);
        saveData();
        renderStocks();
        showNotification('Stock deleted successfully!', 'success');
    }
}

function renderStocks() {
    const stocksTbody = document.getElementById('stocks-tbody');
    const stocksCount = document.getElementById('stocks-count');
    if (!stocksTbody) return;
    
    // Update count
    if (stocksCount) {
        stocksCount.textContent = portfolio.stocks.length;
    }
    
    if (portfolio.stocks.length === 0) {
        stocksTbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-400">No stocks added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    let totalPnl = 0;
    
    // First pass: calculate total values
    portfolio.stocks.forEach(stock => {
        const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
        const currentPrice = cachedData.price || 0;
        const value = currentPrice * stock.quantity;
        const purchaseValue = stock.purchasePrice * stock.quantity;
        const pnl = value - purchaseValue;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (stock.currency === 'USD') {
            valueEur = value / eurUsdRate;
            pnlEur = pnl / eurUsdRate;
        }
        
        totalValue += valueEur;
        totalPnl += pnlEur;
    });
    
    // Second pass: render rows with allocation percentages
    portfolio.stocks.forEach(stock => {
        const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
        const currentPrice = cachedData.price || 0;
        const change24h = cachedData.change24h || 0;
        const value = currentPrice * stock.quantity;
        const purchaseValue = stock.purchasePrice * stock.quantity;
        const pnl = value - purchaseValue;
        const pnlPercentage = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (stock.currency === 'USD') {
            valueEur = value / eurUsdRate;
            pnlEur = pnl / eurUsdRate;
        }
        
        const pnlClass = pnl >= 0 ? 'positive-gain' : 'negative-gain';
        const pnlSign = pnl >= 0 ? '+' : '';
        
        // Calculate allocation percentage
        const allocationPercentage = totalValue > 0 ? (valueEur / totalValue) * 100 : 0;
        
        // Format 24h change
        const change24hClass = change24h >= 0 ? 'text-emerald-400' : 'text-red-400';
        const change24hSign = change24h >= 0 ? '+' : '';
        const change24hDisplay = currentPrice > 0 ? `${change24hSign}${change24h.toFixed(2)}%` : '--';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 font-semibold">
                    <a href="https://finance.yahoo.com/quote/${stock.name}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">
                        ${stock.name}
                    </a>
                </td>
                <td class="py-2 px-2">${stock.quantity}</td>
                <td class="py-2 px-2">${formatCurrency(stock.purchasePrice, stock.currency)}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(currentPrice, stock.currency) : '--'}</td>
                <td class="py-2 px-2 ${change24hClass}">${change24hDisplay}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(value, stock.currency) : '--'}</td>
                <td class="py-2 px-2">${allocationPercentage.toFixed(1)}%</td>
                <td class="py-2 px-2 ${pnlClass}">
                    ${currentPrice > 0 ? `${pnlSign}${formatCurrency(pnl, stock.currency)} (${pnlSign}${pnlPercentage.toFixed(2)}%)` : '--'}
                </td>
                <td class="py-2 px-2">
                    <button onclick="editStock(${stock.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</button>
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
                <td class="py-2 px-2 font-bold text-emerald-300">${formatCurrency(totalValue, 'EUR')}</td>
                <td class="py-2 px-2 font-bold text-emerald-300">100.0%</td>
                <td class="py-2 px-2 font-bold ${totalPnlClass}">
                    ${totalPnlSign}${formatCurrency(totalPnl, 'EUR')} (${totalPnlSign}${totalPnlPercentage.toFixed(2)}%)
                </td>
                <td class="py-2 px-2"></td>
            </tr>
        `;
    }
    
    stocksTbody.innerHTML = html;
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
                    <a href="api-keys.html" class="text-blue-400 hover:text-blue-300 underline">Configure API Keys</a>
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
                        <div class="mb-4 p-3 bg-gray-700 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-semibold text-emerald-400">${ticker}</h4>
                                ${lastFetchedTime ? `<div class="text-xs text-gray-400">Last fetched: ${lastFetchedTime.toLocaleString()}</div>` : ''}
                            </div>
                            <div class="space-y-2">
                    `;
                    
                    earningsData.earningsCalendar.forEach(event => {
                        const eventDate = new Date(event.date);
                        const today = new Date();
                        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                        
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
                            <div class="mb-3 p-3 bg-gray-600 rounded-lg">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-gray-300 font-medium">Earnings Report</span>
                                    <div class="text-right">
                                        <div class="text-emerald-400 font-semibold">${eventDate.toLocaleDateString()}</div>
                                        <div class="text-xs text-gray-400">${dateText}</div>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-400 space-y-1">
                                    <div>Time: ${timeText}</div>
                                    ${quarterText ? `<div>Period: ${quarterText}</div>` : ''}
                                    ${event.epsEstimate ? `<div>EPS Estimate: $${event.epsEstimate.toFixed(2)}</div>` : ''}
                                    ${event.revenueEstimate ? `<div>Revenue Estimate: $${(event.revenueEstimate / 1000000000).toFixed(1)}B</div>` : ''}
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

function handleBuyStock() {
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
    
        // Convert to EUR if needed
        let priceInEur = finalPrice;
        let totalInEur = finalTotal;
        if (currency === 'USD') {
            priceInEur = finalPrice / eurUsdRate;
            totalInEur = finalTotal / eurUsdRate;
        }
        
        // Create transaction
        const transaction = {
            id: Date.now().toString(),
            type: 'buy',
            assetType: 'stocks',
            symbol: symbol,
            quantity: quantity,
            price: priceInEur,
            total: totalInEur,
            currency: 'EUR',
            originalPrice: currency === 'USD' ? finalPrice : null,
            originalCurrency: currency === 'USD' ? 'USD' : null,
            date: date,
            note: note || `Bought ${quantity} shares of ${symbol} at €${priceInEur.toFixed(2)} per share`,
            timestamp: new Date().toISOString()
        };
        
        addTransaction(transaction);
        saveData();
        calculatePortfolioFromTransactions();
        renderStocks();
        renderStockTransactions();
        closeBuyStockModal();
        
        showNotification(`Successfully bought ${quantity} shares of ${symbol}`, 'success');
        
    } catch (error) {
        console.error('Error in handleBuyStock:', error);
        showNotification(`Error buying stock: ${error.message}`, 'error');
    }
}

function handleSellStock() {
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
    
    // Convert to EUR if needed
    let priceInEur = finalPrice;
    let totalInEur = finalTotal;
    if (currency === 'USD') {
        priceInEur = finalPrice / eurUsdRate;
        totalInEur = finalTotal / eurUsdRate;
    }
    
    // Record transaction
    const transaction = {
        id: Date.now().toString(),
        type: 'sell',
        assetType: 'stocks',
        symbol: symbol,
        quantity: quantity,
        price: priceInEur,
        total: totalInEur,
        currency: 'EUR',
        originalPrice: currency === 'USD' ? finalPrice : null,
        originalCurrency: currency === 'USD' ? 'USD' : null,
        date: date,
        note: note || `Sold ${quantity} shares of ${symbol} at €${priceInEur.toFixed(2)} per share`,
        timestamp: new Date().toISOString()
    };
    
    addTransaction(transaction);
    saveData();
    calculatePortfolioFromTransactions();
    renderStocks();
    renderStockTransactions();
    closeSellStockModal();
    
    showNotification(`Successfully sold ${quantity} shares of ${symbol}`, 'success');
}

// Transaction history rendering
function renderStockTransactions() {
    const tbody = document.getElementById('stock-transactions-tbody');
    if (!tbody) return;
    
    const transactions = loadTransactions().filter(tx => tx.assetType === 'stocks');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-400">No stock transactions yet.</td></tr>';
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
            priceDisplay = `€${tx.price.toFixed(2)} ($${tx.originalPrice.toFixed(2)})`;
        }
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 text-gray-300">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="py-2 px-2 ${typeColor}">${typeText}</td>
                <td class="py-2 px-2 text-white font-medium">${tx.symbol}</td>
                <td class="py-2 px-2 text-gray-300">${tx.quantity}</td>
                <td class="py-2 px-2 text-gray-300">${priceDisplay}</td>
                <td class="py-2 px-2 text-gray-300">${formatCurrency(tx.total, tx.currency)}</td>
                <td class="py-2 px-2 text-gray-300">${tx.currency}</td>
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
    document.getElementById('edit-transaction-price').value = transaction.price;
    document.getElementById('edit-transaction-currency').value = transaction.currency;
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
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const transactionId = document.getElementById('edit-transaction-id').value;
            const type = document.getElementById('edit-transaction-type').value;
            const symbol = document.getElementById('edit-transaction-symbol').value.toUpperCase();
            const quantity = parseFloat(document.getElementById('edit-transaction-quantity').value);
            const price = parseFloat(document.getElementById('edit-transaction-price').value);
            const currency = document.getElementById('edit-transaction-currency').value;
            const date = document.getElementById('edit-transaction-date').value;
            const note = document.getElementById('edit-transaction-note').value.trim();
            
            if (!symbol || !quantity || !price || !date) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Convert to EUR if needed
            let priceInEur = price;
            if (currency === 'USD') {
                priceInEur = price / eurUsdRate;
            }
            
            const total = quantity * priceInEur;
            
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
                total,
                currency: 'EUR', // Always store in EUR
                originalPrice: currency === 'USD' ? price : null,
                originalCurrency: currency === 'USD' ? 'USD' : null,
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

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
    renderStockTransactions();
});
