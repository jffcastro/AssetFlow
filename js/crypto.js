// Crypto page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const cryptoModal = document.getElementById('crypto-modal');
    const cryptoForm = document.getElementById('crypto-form');
    const cryptoCancelBtn = document.getElementById('crypto-cancel-btn');
    const cryptoModalTitle = document.getElementById('crypto-modal-title');
    // Price update button removed - handled automatically from dashboard
    
    const cryptoIdInput = document.getElementById('crypto-id');
    const cryptoNameInput = document.getElementById('crypto-name');
    const cryptoQuantityInput = document.getElementById('crypto-quantity');
    const cryptoPurchasePriceInput = document.getElementById('crypto-purchase-price');
    const cryptoCurrencySelect = document.getElementById('crypto-currency');
    const cryptoTbody = document.getElementById('crypto-tbody');
    
    // Buy/Sell DOM elements
    const buyCryptoBtn = document.getElementById('buy-crypto-btn');
    const sellCryptoBtn = document.getElementById('sell-crypto-btn');
    const buyCryptoModal = document.getElementById('buy-crypto-modal');
    const sellCryptoModal = document.getElementById('sell-crypto-modal');
    const buyCryptoForm = document.getElementById('buy-crypto-form');
    const sellCryptoForm = document.getElementById('sell-crypto-form');
    const buyCryptoCancelBtn = document.getElementById('buy-crypto-cancel-btn');
    const sellCryptoCancelBtn = document.getElementById('sell-crypto-cancel-btn');
    const sellCryptoNameSelect = document.getElementById('sell-crypto-name');
    const refreshCryptoTransactionsBtn = document.getElementById('refresh-crypto-transactions-btn');
    const refreshCryptoEventsBtn = document.getElementById('refresh-crypto-events-btn');
    const cryptoTransactionsFilter = document.getElementById('crypto-transactions-filter');

    // Event listeners
    cryptoCancelBtn.addEventListener('click', closeCryptoModal);
    cryptoModal.addEventListener('click', (e) => {
        if (e.target === cryptoModal) closeCryptoModal();
    });
    
    cryptoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCrypto();
    });

    // Buy/Sell event listeners
    buyCryptoBtn.addEventListener('click', openBuyCryptoModal);
    sellCryptoBtn.addEventListener('click', openSellCryptoModal);
    buyCryptoCancelBtn.addEventListener('click', closeBuyCryptoModal);
    sellCryptoCancelBtn.addEventListener('click', closeSellCryptoModal);
    buyCryptoModal.addEventListener('click', (e) => {
        if (e.target === buyCryptoModal) closeBuyCryptoModal();
    });
    sellCryptoModal.addEventListener('click', (e) => {
        if (e.target === sellCryptoModal) closeSellCryptoModal();
    });
    
    buyCryptoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleBuyCrypto();
    });
    
    sellCryptoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSellCrypto();
    });
    
    refreshCryptoTransactionsBtn.addEventListener('click', renderCryptoTransactions);
    refreshCryptoEventsBtn.addEventListener('click', loadCryptoEvents);
    cryptoTransactionsFilter.addEventListener('input', filterCryptoTransactions);
    
    // Set up auto-calculation for buy form
    setupAutoCalculation('buy-crypto-quantity', 'buy-crypto-price', 'buy-crypto-total');
    
    // Set up auto-calculation for sell form
    setupAutoCalculation('sell-crypto-quantity', 'sell-crypto-price', 'sell-crypto-total');
    
    // Price updates are now handled automatically from the dashboard
    
    // Initial render
    renderCrypto();
    loadCryptoEvents();
    
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

function openCryptoModal(mode = 'add', crypto = null) {
    const cryptoForm = document.getElementById('crypto-form');
    const cryptoModalTitle = document.getElementById('crypto-modal-title');
    const cryptoIdInput = document.getElementById('crypto-id');
    const cryptoNameInput = document.getElementById('crypto-name');
    const cryptoQuantityInput = document.getElementById('crypto-quantity');
    const cryptoPurchasePriceInput = document.getElementById('crypto-purchase-price');
    const cryptoCurrencySelect = document.getElementById('crypto-currency');
    
    cryptoForm.reset();
    cryptoModalTitle.textContent = mode === 'add' ? 'Add New Cryptocurrency' : 'Edit Cryptocurrency';
    cryptoIdInput.value = crypto ? crypto.id : '';
    
    if (crypto) {
        cryptoNameInput.value = crypto.name;
        cryptoQuantityInput.value = crypto.quantity;
        cryptoPurchasePriceInput.value = crypto.purchasePrice;
        cryptoCurrencySelect.value = crypto.currency;
    } else {
        cryptoCurrencySelect.value = 'EUR';
    }
    
    document.getElementById('crypto-modal').classList.remove('hidden');
}

function closeCryptoModal() {
    document.getElementById('crypto-modal').classList.add('hidden');
}

function saveCrypto() {
    const cryptoIdInput = document.getElementById('crypto-id');
    const cryptoNameInput = document.getElementById('crypto-name');
    const cryptoQuantityInput = document.getElementById('crypto-quantity');
    const cryptoPurchasePriceInput = document.getElementById('crypto-purchase-price');
    const cryptoCurrencySelect = document.getElementById('crypto-currency');
    
    const cryptoData = {
        id: cryptoIdInput.value ? parseInt(cryptoIdInput.value) : Date.now(),
        name: cryptoNameInput.value,
        quantity: parseFloat(cryptoQuantityInput.value),
        purchasePrice: parseFloat(cryptoPurchasePriceInput.value),
        currency: cryptoCurrencySelect.value
    };
    
    if (cryptoIdInput.value) {
        // Edit existing crypto
        const index = portfolio.crypto.findIndex(c => c.id == cryptoIdInput.value);
        if (index !== -1) {
            portfolio.crypto[index] = cryptoData;
        }
    } else {
        // Add new crypto
        portfolio.crypto.push(cryptoData);
    }
    
    saveData();
    renderCrypto();
    closeCryptoModal();
    showNotification('Cryptocurrency saved successfully!', 'success');
}

function deleteCrypto(id) {
    if (confirm('Are you sure you want to delete this cryptocurrency? This will also remove all associated transactions from the transaction history.')) {
        // Find the crypto to get its symbol
        const crypto = portfolio.crypto.find(c => c.id == id);
        if (!crypto) {
            showNotification('Cryptocurrency not found', 'error');
            return;
        }
        
        // Remove all transactions for this crypto
        const transactions = loadTransactions();
        const updatedTransactions = transactions.filter(tx => !(tx.assetType === 'crypto' && tx.symbol === crypto.name));
        saveTransactions(updatedTransactions);
        
        // Remove the crypto from portfolio
        portfolio.crypto = portfolio.crypto.filter(c => c.id != id);
        saveData();
        
        // Recalculate portfolio from transactions (source of truth)
        calculatePortfolioFromTransactions();
        renderCrypto();
        renderCryptoTransactions(); // Refresh transaction history
        showNotification('Cryptocurrency and all associated transactions deleted successfully!', 'success');
    }
}

function renderCrypto() {
    const cryptoTbody = document.getElementById('crypto-tbody');
    const cryptoCount = document.getElementById('crypto-count');
    if (!cryptoTbody) return;
    
    // Update count
    if (cryptoCount) {
        cryptoCount.textContent = portfolio.crypto.length;
    }
    
    if (portfolio.crypto.length === 0) {
        cryptoTbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-gray-400">No cryptocurrencies added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    let totalPnl = 0;
    
    // First pass: calculate total values
    portfolio.crypto.forEach(crypto => {
        const cachedData = (priceCache.crypto && priceCache.crypto[crypto.name]) || {};
        const currentPrice = cachedData.price || 0;
        const value = currentPrice * crypto.quantity;
        const purchaseValue = crypto.purchasePrice * crypto.quantity;
        const pnl = value - purchaseValue;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (crypto.currency === 'USD') {
            valueEur = value / eurUsdRate;
            pnlEur = pnl / eurUsdRate;
        }
        
        totalValue += valueEur;
        totalPnl += pnlEur;
    });
    
    // Second pass: render rows with allocation percentages
    portfolio.crypto.forEach(crypto => {
        const cachedData = (priceCache.crypto && priceCache.crypto[crypto.name]) || {};
        const currentPrice = cachedData.price || 0;
        const change24h = cachedData.change24h || 0;
        const value = currentPrice * crypto.quantity;
        const purchaseValue = crypto.purchasePrice * crypto.quantity;
        const pnl = value - purchaseValue;
        const pnlPercentage = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (crypto.currency === 'USD') {
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
        
        // Calculate holding time
        const transactions = loadTransactions();
        const holdingTime = calculateHoldingTime(transactions, 'crypto', crypto.name);
        const holdingTimeDisplay = holdingTime ? 
            `${holdingTime.years > 0 ? holdingTime.years + 'y ' : ''}${holdingTime.months > 0 ? holdingTime.months + 'm ' : ''}${holdingTime.daysRemainder}d` : 
            '--';
        
        // Calculate realized P&L for this crypto
        const realizedPnL = calculateRealizedPnL(transactions);
        const cryptoRealizedPnL = realizedPnL.byAsset[`crypto-${crypto.name}`] || 0;
        const realizedPnLDisplay = cryptoRealizedPnL !== 0 ? formatCurrency(cryptoRealizedPnL, 'EUR') : '--';
        const realizedPnLClass = cryptoRealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 font-semibold">
                    <a href="https://coinmarketcap.com/currencies/${crypto.name.toLowerCase().replace(/\s+/g, '-')}/" target="_blank" class="text-blue-400 hover:text-blue-300 underline">
                        ${crypto.name}
                    </a>
                </td>
                <td class="py-2 px-2">${crypto.quantity}</td>
                <td class="py-2 px-2">${formatCurrency(crypto.purchasePrice, crypto.currency)}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(currentPrice, crypto.currency) : '--'}</td>
                <td class="py-2 px-2 ${change24hClass}">${change24hDisplay}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(value, crypto.currency) : '--'}</td>
                <td class="py-2 px-2">${allocationPercentage.toFixed(1)}%</td>
                <td class="py-2 px-2 ${pnlClass}">
                    ${currentPrice > 0 ? `${pnlSign}${formatCurrency(pnl, crypto.currency)} (${pnlSign}${pnlPercentage.toFixed(2)}%)` : '--'}
                </td>
                <td class="py-2 px-2 ${realizedPnLClass}">${realizedPnLDisplay}</td>
                <td class="py-2 px-2 text-gray-300">${holdingTimeDisplay}</td>
                <td class="py-2 px-2">
                    <button onclick="deleteCrypto(${crypto.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Add total row
    if (portfolio.crypto.length > 0) {
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
                <td class="py-2 px-2 font-bold text-emerald-300">--</td>
                <td class="py-2 px-2 font-bold text-emerald-300">--</td>
                <td class="py-2 px-2"></td>
            </tr>
        `;
    }
    
    cryptoTbody.innerHTML = html;
}

function editCrypto(id) {
    const crypto = portfolio.crypto.find(c => c.id == id);
    if (crypto) {
        openCryptoModal('edit', crypto);
    }
}

async function updateCryptoPrices() {
    const getCryptoPricesBtn = document.getElementById('get-crypto-prices-btn');
    if (getCryptoPricesBtn) {
        getCryptoPricesBtn.disabled = true;
        getCryptoPricesBtn.textContent = 'Updating...';
    }
    
    let updatedCount = 0;
    const promises = portfolio.crypto.map(async (crypto) => {
        try {
            const price = await fetchCryptoPrice(crypto.name, crypto.currency || 'USD');
            if (price) {
                if (!priceCache.crypto) priceCache.crypto = {};
                priceCache.crypto[crypto.name] = price;
                updatedCount++;
            }
        } catch (error) {
            console.error(`Error fetching price for ${crypto.name}:`, error);
        }
    });
    
    await Promise.all(promises);
    savePriceCache();
    
    // Also update sold assets prices (crypto only)
    await fetchSoldAssetsPrices('crypto');
    
    renderCrypto();
    
    // Re-render sold assets if they're currently visible
    const soldAssetsContainer = document.getElementById('sold-assets-container');
    if (soldAssetsContainer && !soldAssetsContainer.classList.contains('hidden')) {
        await renderSoldAssets();
    }
    
    if (getCryptoPricesBtn) {
        getCryptoPricesBtn.disabled = false;
        getCryptoPricesBtn.textContent = 'Update Prices';
    }
    
    showNotification(`Updated prices for ${updatedCount} cryptocurrencies`, 'success');
}

async function loadCryptoEvents() {
    const cryptoEventsDiv = document.getElementById('crypto-events');
    if (!cryptoEventsDiv) return;
    
    try {
        const symbols = getCryptoSymbols();
        if (symbols.length === 0) {
            cryptoEventsDiv.innerHTML = '<div class="text-gray-400">No crypto assets added to show events.</div>';
            return;
        }
        
        // Check if CoinMarketCal API key is configured
        const apiKey = getApiKey('CoinMarketCal');
        if (!apiKey) {
            cryptoEventsDiv.innerHTML = `
                <div class="text-yellow-400 mb-2">⚠️ CoinMarketCal API key not configured</div>
                <div class="text-gray-400 mb-2">Configure your CoinMarketCal API key to view crypto events.</div>
                <div class="mt-2">
                    <a href="configurations.html" class="text-orange-400 hover:text-orange-300 underline">Configure API Keys</a>
                </div>
            `;
            return;
        }
        
        // Show loading state
        cryptoEventsDiv.innerHTML = '<div class="text-gray-400">Loading crypto events...</div>';
        
        // Check for cached data first, then fetch if needed
        let eventsData = getCachedCryptoEventsForCoins(symbols);
        
        if (!eventsData) {
            // If no cached data, fetch from API
            eventsData = await fetchCryptoEvents(symbols, 15);
        } else {
            console.log('Using cached crypto events data');
        }
        
        if (!eventsData || !eventsData.body || eventsData.body.length === 0) {
            cryptoEventsDiv.innerHTML = `
                <div class="text-gray-400 mb-2">No upcoming crypto events found.</div>
                <div class="mt-2">
                    <a href="https://coinmarketcal.com/" target="_blank" class="text-orange-400 hover:text-orange-300 underline">View Full Crypto Calendar</a>
                </div>
            `;
            return;
        }
        
        // Get the timestamp from cached data if available
        let lastFetchedTime = null;
        const cached = getCachedCryptoEvents();
        const cacheKey = symbols.length > 0 ? symbols.sort().join(',') : 'all';
        const coinData = cached[cacheKey];
        if (coinData && coinData.timestamp) {
            lastFetchedTime = new Date(coinData.timestamp);
        }
        
        // Display events
        let eventsHtml = '<div class="space-y-1">';
        
        // Add last fetched timestamp at the top
        if (lastFetchedTime) {
            eventsHtml += `
                <div class="text-xs text-gray-400 mb-2 text-center">
                    ${lastFetchedTime.toLocaleString()}
                </div>
            `;
        }
        
        eventsData.body.forEach(event => {
            const eventDate = new Date(event.date_event);
            const today = new Date();
            const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            
            let dateText = '';
            if (daysUntil === 0) {
                dateText = 'Today';
            } else if (daysUntil === 1) {
                dateText = 'Tomorrow';
            } else if (daysUntil > 0) {
                dateText = `In ${daysUntil} days`;
            } else {
                return; // Skip past events
            }
            
            // Format coins involved
            const coinsText = event.coins ? event.coins.map(coin => coin.symbol).join(', ') : 'Various';
            
            // Format category
            const categoryText = event.categories ? event.categories[0].name : 'General';
            
            // Format confidence (votes) - CoinMarketCal doesn't provide vote_count in this response
            const confidenceText = 'Verified Event';
            
            // Get title (prefer English, fallback to any available)
            const eventTitle = event.title?.en || event.title || event['-'] || 'Untitled Event';
            
            eventsHtml += `
                <div class="p-2 bg-gray-700 rounded border-l-2 border-orange-400">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-sm font-semibold text-orange-400">${eventTitle}</h4>
                        <div class="text-right text-xs">
                            <div class="text-emerald-400 font-medium">${eventDate.toLocaleDateString()}</div>
                            <div class="text-gray-400">${dateText}</div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1 text-xs text-gray-400 mb-1">
                        <span class="bg-gray-600 px-1 py-0.5 rounded text-xs">${coinsText}</span>
                        <span class="bg-gray-600 px-1 py-0.5 rounded text-xs">${categoryText}</span>
                        <span class="bg-gray-600 px-1 py-0.5 rounded text-xs">${confidenceText}</span>
                        ${event.can_occur_before ? '<span class="bg-yellow-600 px-1 py-0.5 rounded text-xs">Can occur before</span>' : ''}
                    </div>
                    ${event.source ? `<div class="text-xs"><a href="${event.source}" target="_blank" class="text-orange-400 hover:text-orange-300 underline">View Source</a></div>` : ''}
                </div>
            `;
        });
        
        eventsHtml += '</div>';
        cryptoEventsDiv.innerHTML = eventsHtml;
        
    } catch (error) {
        console.error('Error loading crypto events:', error);
        cryptoEventsDiv.innerHTML = `
            <div class="text-red-400 mb-2">Error loading crypto events.</div>
            <div class="text-gray-400 text-sm">Please check your CoinMarketCal API key configuration.</div>
        `;
    }
}

function getCryptoSymbols() {
    const symbols = new Set();
    portfolio.crypto.forEach(crypto => {
        if (crypto.name) symbols.add(crypto.name.toLowerCase());
    });
    return Array.from(symbols);
}

// Notes functionality
function initializeNotes() {
    const notesTextarea = document.getElementById('crypto-notes');
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
    const notesTextarea = document.getElementById('crypto-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const notes = localStorage.getItem('cryptoNotes') || '';
        notesTextarea.value = notes;
        updateCharCount();
    }
}

function autoSaveNotes() {
    const notesTextarea = document.getElementById('crypto-notes');
    
    if (notesTextarea) {
        const notes = notesTextarea.value;
        localStorage.setItem('cryptoNotes', notes);
    }
}

function updateCharCount() {
    const notesTextarea = document.getElementById('crypto-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const count = notesTextarea.value.length;
        charCount.textContent = count;
    }
}

// Buy/Sell functionality
function openBuyCryptoModal() {
    const modal = document.getElementById('buy-crypto-modal');
    const dateInput = document.getElementById('buy-crypto-date');
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeBuyCryptoModal() {
    const modal = document.getElementById('buy-crypto-modal');
    modal.classList.add('hidden');
    document.getElementById('buy-crypto-form').reset();
}

function openSellCryptoModal() {
    const modal = document.getElementById('sell-crypto-modal');
    const dateInput = document.getElementById('sell-crypto-date');
    const nameSelect = document.getElementById('sell-crypto-name');
    
    // Populate crypto names dropdown
    nameSelect.innerHTML = '<option value="">Select a cryptocurrency to sell</option>';
    if (portfolio.crypto) {
        portfolio.crypto.forEach(crypto => {
            if (crypto.quantity > 0) {
                const option = document.createElement('option');
                option.value = crypto.name;
                option.textContent = `${crypto.name} (${crypto.quantity} units)`;
                nameSelect.appendChild(option);
            }
        });
    }
    
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeSellCryptoModal() {
    const modal = document.getElementById('sell-crypto-modal');
    modal.classList.add('hidden');
    document.getElementById('sell-crypto-form').reset();
}


function handleBuyCrypto() {
    const name = document.getElementById('buy-crypto-name').value.trim();
    const quantity = parseFloat(document.getElementById('buy-crypto-quantity').value);
    const price = parseFloat(document.getElementById('buy-crypto-price').value);
    const total = parseFloat(document.getElementById('buy-crypto-total').value);
    const currency = document.getElementById('buy-crypto-currency').value;
    const date = document.getElementById('buy-crypto-date').value;
    const note = document.getElementById('buy-crypto-note').value.trim();
    
    // Validate required fields
    if (!name || !quantity || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate exchange rate for USD transactions
    if (currency === 'USD' && (isNaN(eurUsdRate) || eurUsdRate === 0)) {
        showNotification('Exchange rate not available. Please update rates first by clicking "Update All" on the dashboard.', 'error');
        return;
    }
    
    // Validate that either price or total is provided
     if ((price === null || price === undefined || isNaN(price)) && (total === null || total === undefined || isNaN(total))) {
        showNotification('Please provide either price per unit or total amount', 'error');
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
        type: 'buy',
        assetType: 'crypto',
        symbol: name,
        quantity: quantity,
        price: priceInEur,
        total: totalInEur,
        currency: 'EUR',
        originalPrice: currency === 'USD' ? finalPrice : null,
        originalCurrency: currency === 'USD' ? 'USD' : null,
        date: date,
    note: note || `Bought ${quantity} units of ${name} at €${priceInEur.toFixed(8)} per unit`,
        timestamp: new Date().toISOString()
    };
    
    addTransaction(transaction);
    saveData();
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderCrypto();
    renderCryptoTransactions();
    closeBuyCryptoModal();
    
    showNotification(`Successfully bought ${quantity} units of ${name}`, 'success');
}

function handleSellCrypto() {
    const name = document.getElementById('sell-crypto-name').value;
    const quantity = parseFloat(document.getElementById('sell-crypto-quantity').value);
    const price = parseFloat(document.getElementById('sell-crypto-price').value);
    const total = parseFloat(document.getElementById('sell-crypto-total').value);
    const currency = document.getElementById('sell-crypto-currency').value;
    const date = document.getElementById('sell-crypto-date').value;
    const note = document.getElementById('sell-crypto-note').value.trim();
    
    // Validate required fields
    if (!name || !quantity || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate that either price or total is provided
    if (!price && !total) {
        showNotification('Please provide either price per unit or total amount', 'error');
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
        assetType: 'crypto',
        symbol: name,
        quantity: quantity,
        price: priceInEur,
        total: totalInEur,
        currency: 'EUR',
        originalPrice: currency === 'USD' ? finalPrice : null,
        originalCurrency: currency === 'USD' ? 'USD' : null,
        date: date,
    note: note || `Sold ${quantity} units of ${name} at €${priceInEur.toFixed(8)} per unit`,
        timestamp: new Date().toISOString()
    };
    
    addTransaction(transaction);
    saveData();
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderCrypto();
    renderCryptoTransactions();
    closeSellCryptoModal();
    
    showNotification(`Successfully sold ${quantity} units of ${name}`, 'success');
}

// Transaction history rendering
function renderCryptoTransactions() {
    const tbody = document.getElementById('crypto-transactions-tbody');
    if (!tbody) return;
    
    const transactions = loadTransactions().filter(tx => tx.assetType === 'crypto');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-gray-400">No crypto transactions yet.</td></tr>';
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
            priceDisplay = `€${price.toFixed(8)} ($${originalPrice.toFixed(8)})`;
        }
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 text-gray-300">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="py-2 px-2 ${typeColor}">${typeText}</td>
                <td class="py-2 px-2 text-white font-medium">${tx.symbol}</td>
                <td class="py-2 px-2 text-gray-300">${tx.quantity.toFixed(8)}</td>
                <td class="py-2 px-2 text-gray-300">${priceDisplay}</td>
                <td class="py-2 px-2 text-gray-300">${formatCurrency(tx.total, 'EUR')}</td>
                <td class="py-2 px-2 text-gray-300">${tx.originalCurrency || 'EUR'}</td>
                <td class="py-2 px-2 text-gray-300">${tx.historicalRate ? tx.historicalRate.toFixed(4) : '--'}</td>
                <td class="py-2 px-2 text-gray-300">${tx.note || '-'}</td>
                <td class="py-2 px-2">
                    <button onclick="editCryptoTransaction('${tx.id}')" class="glass-button text-xs px-2 py-1 mr-1">✏️</button>
                    <button onclick="deleteCryptoTransaction('${tx.id}')" class="glass-button glass-button-danger text-xs px-2 py-1">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Edit and delete crypto transaction functions
function editCryptoTransaction(transactionId) {
    const transactions = loadTransactions();
    const transaction = transactions.find(tx => tx.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction not found', 'error');
        return;
    }
    
    // Populate the edit modal
    document.getElementById('edit-crypto-transaction-id').value = transaction.id;
    document.getElementById('edit-crypto-transaction-type').value = transaction.type;
    document.getElementById('edit-crypto-transaction-name').value = transaction.symbol;
    document.getElementById('edit-crypto-transaction-quantity').value = transaction.quantity;
    // Set currency and price based on original currency
    if (transaction.originalCurrency === 'USD') {
        document.getElementById('edit-crypto-transaction-currency').value = 'USD';
        document.getElementById('edit-crypto-transaction-price').value = transaction.originalPrice;
        document.getElementById('edit-crypto-transaction-total').value = transaction.originalPrice * transaction.quantity;
    } else {
        document.getElementById('edit-crypto-transaction-currency').value = 'EUR';
        document.getElementById('edit-crypto-transaction-price').value = transaction.price;
        document.getElementById('edit-crypto-transaction-total').value = transaction.total;
    }
    
    document.getElementById('edit-crypto-transaction-date').value = transaction.date;
    document.getElementById('edit-crypto-transaction-note').value = transaction.note || '';
    
    // Show the modal
    document.getElementById('edit-crypto-transaction-modal').classList.remove('hidden');
}

function deleteCryptoTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    const transactions = loadTransactions();
    const transaction = transactions.find(tx => tx.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction not found', 'error');
        return;
    }
    
    // Remove the transaction
    const updatedTransactions = transactions.filter(tx => tx.id !== transactionId);
    saveTransactions(updatedTransactions);
    
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderCrypto();
    renderCryptoTransactions();
    
    showNotification('Transaction deleted successfully', 'success');
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
    renderCryptoTransactions();
    
    // Add event listeners for edit crypto transaction modal
    const editCryptoTransactionForm = document.getElementById('edit-crypto-transaction-form');
    const editCryptoTransactionCancelBtn = document.getElementById('edit-crypto-transaction-cancel-btn');
    const editCryptoTransactionModal = document.getElementById('edit-crypto-transaction-modal');
    
    if (editCryptoTransactionForm) {
        // Setup auto-calculation for edit form
        setupAutoCalculation('edit-crypto-transaction-quantity', 'edit-crypto-transaction-price', 'edit-crypto-transaction-total');
        
        editCryptoTransactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const transactionId = document.getElementById('edit-crypto-transaction-id').value;
            const type = document.getElementById('edit-crypto-transaction-type').value;
            const name = document.getElementById('edit-crypto-transaction-name').value;
            const quantity = parseFloat(document.getElementById('edit-crypto-transaction-quantity').value);
            const price = parseFloat(document.getElementById('edit-crypto-transaction-price').value);
            const total = parseFloat(document.getElementById('edit-crypto-transaction-total').value);
            const currency = document.getElementById('edit-crypto-transaction-currency').value;
            const date = document.getElementById('edit-crypto-transaction-date').value;
            const note = document.getElementById('edit-crypto-transaction-note').value.trim();
            
            if (!name || isNaN(quantity) || isNaN(price) || isNaN(total) || !date) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            const transactions = loadTransactions();
            const transactionIndex = transactions.findIndex(tx => tx.id === transactionId);
            
            if (transactionIndex === -1) {
                showNotification('Transaction not found', 'error');
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
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                type: type,
                symbol: name,
                quantity: quantity,
                price: priceInEur,
                total: totalInEur,
                currency: 'EUR', // Always store in EUR
                originalPrice: currency === 'USD' ? price : null,
                originalCurrency: currency === 'USD' ? 'USD' : null,
                historicalRate: currency === 'USD' ? historicalRate : null,
                date: date,
                note: note || transactions[transactionIndex].note,
                timestamp: new Date().toISOString()
            };
            
            saveTransactions(transactions);
            
            // Recalculate portfolio from transactions (source of truth)
            calculatePortfolioFromTransactions();
            renderCrypto();
            renderCryptoTransactions();
            
            // Close modal
            editCryptoTransactionModal.classList.add('hidden');
            
            showNotification('Transaction updated successfully', 'success');
        });
    }
    
    if (editCryptoTransactionCancelBtn) {
        editCryptoTransactionCancelBtn.addEventListener('click', () => {
            editCryptoTransactionModal.classList.add('hidden');
        });
    }
    
    if (editCryptoTransactionModal) {
        editCryptoTransactionModal.addEventListener('click', (e) => {
            if (e.target === editCryptoTransactionModal) {
                editCryptoTransactionModal.classList.add('hidden');
            }
        });
    }
});

function filterCryptoTransactions() {
    const filterValue = document.getElementById('crypto-transactions-filter').value.toLowerCase();
    const tbody = document.getElementById('crypto-transactions-tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) {
            // Skip the "no transactions" row
            return;
        }
        
        const nameCell = row.cells[2]; // Name column
        const noteCell = row.cells[7]; // Note column
        
        const name = nameCell ? nameCell.textContent.toLowerCase() : '';
        const note = noteCell ? noteCell.textContent.toLowerCase() : '';
        
        const matches = name.includes(filterValue) || note.includes(filterValue);
        row.style.display = matches ? '' : 'none';
    });
}

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
        const soldAssets = getSoldAssetsAnalysis(transactions, 'crypto');
        
        if (soldAssets.length === 0) {
            soldAssetsLoading.classList.add('hidden');
            soldAssetsEmpty.classList.remove('hidden');
            return;
        }
        
        // Update with current prices
        const updatedAssets = updateSoldAssetsWithCurrentPrices(soldAssets, 'crypto');
        
        // Render the table
        soldAssetsTbody.innerHTML = '';
        updatedAssets.forEach(asset => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/50';
            const formatCurrency = (value) => {
                if (value === null || value === undefined) return '--';
                return `€${value.toFixed(8)}`;
            };
            const formatPnL = (value) => {
                if (value === null || value === undefined) return '--';
                const formatted = `€${Math.abs(value).toFixed(8)}`;
                return value >= 0 ? `+${formatted}` : `-${formatted}`;
            };
            const formatDate = (dateStr) => {
                if (dateStr.includes(' - ')) {
                    const [start, end] = dateStr.split(' - ');
                    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
                } else {
                    return new Date(dateStr).toLocaleDateString();
                }
            };
            row.innerHTML = `
                <td class="py-3 px-3 font-medium">${asset.symbol}</td>
                <td class="py-3 px-3">${asset.quantity}</td>
                <td class="py-3 px-3">${formatCurrency(asset.averageSellPrice)}</td>
                <td class="py-3 px-3">${formatCurrency(asset.buyPrice)}</td>
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
