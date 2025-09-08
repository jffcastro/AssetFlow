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
    
    // Price updates are now handled automatically from the dashboard
    
    // Initial render
    renderCrypto();
    loadCryptoEvents();
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
    if (confirm('Are you sure you want to delete this cryptocurrency?')) {
        portfolio.crypto = portfolio.crypto.filter(c => c.id != id);
        saveData();
        renderCrypto();
        showNotification('Cryptocurrency deleted successfully!', 'success');
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
        cryptoTbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-400">No cryptocurrencies added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    let totalPnl = 0;
    
    // First pass: calculate total values
    portfolio.crypto.forEach(crypto => {
        const cachedData = priceCache.crypto[crypto.name] || {};
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
        const cachedData = priceCache.crypto[crypto.name] || {};
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
                <td class="py-2 px-2">
                    <button onclick="editCrypto(${crypto.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</button>
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
                priceCache.crypto[crypto.name] = price;
                updatedCount++;
            }
        } catch (error) {
            console.error(`Error fetching price for ${crypto.name}:`, error);
        }
    });
    
    await Promise.all(promises);
    savePriceCache();
    renderCrypto();
    
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
                    <a href="api-keys.html" class="text-orange-400 hover:text-orange-300 underline">Configure API Keys</a>
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
        let eventsHtml = '<div class="space-y-3">';
        
        // Add last fetched timestamp at the top
        if (lastFetchedTime) {
            eventsHtml += `
                <div class="text-xs text-gray-400 mb-3 text-center">
                    Last fetched: ${lastFetchedTime.toLocaleString()}
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
                <div class="p-4 bg-gray-700 rounded-lg border-l-4 border-orange-400">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-orange-400">${eventTitle}</h4>
                        <div class="text-right text-sm">
                            <div class="text-emerald-400 font-medium">${eventDate.toLocaleDateString()}</div>
                            <div class="text-gray-400">${dateText}</div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-300 mb-2">${event.displayed_date || 'No date details available'}</div>
                    <div class="flex flex-wrap gap-2 text-xs text-gray-400">
                        <span class="bg-gray-600 px-2 py-1 rounded">${coinsText}</span>
                        <span class="bg-gray-600 px-2 py-1 rounded">${categoryText}</span>
                        <span class="bg-gray-600 px-2 py-1 rounded">${confidenceText}</span>
                        ${event.can_occur_before ? '<span class="bg-yellow-600 px-2 py-1 rounded">Can occur before</span>' : ''}
                    </div>
                    ${event.source ? `<div class="mt-2 text-xs"><a href="${event.source}" target="_blank" class="text-orange-400 hover:text-orange-300 underline">View Source</a></div>` : ''}
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
    const currency = document.getElementById('buy-crypto-currency').value;
    const date = document.getElementById('buy-crypto-date').value;
    
    if (!name || !quantity || !price || !date) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Convert to EUR if needed
    let priceInEur = price;
    if (currency === 'USD') {
        priceInEur = price * eurUsdRate;
    }
    
    // Add to portfolio
    if (!portfolio.crypto) portfolio.crypto = [];
    
    const existingCryptoIndex = portfolio.crypto.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    
    if (existingCryptoIndex !== -1) {
        // Update existing crypto
        const existingCrypto = portfolio.crypto[existingCryptoIndex];
        const totalQuantity = existingCrypto.quantity + quantity;
        const totalCost = (existingCrypto.quantity * existingCrypto.purchasePrice) + (quantity * price);
        const averagePrice = totalCost / totalQuantity;
        
        portfolio.crypto[existingCryptoIndex] = {
            ...existingCrypto,
            quantity: totalQuantity,
            purchasePrice: averagePrice
        };
    } else {
        // Add new crypto
        portfolio.crypto.push({
            name: name,
            quantity: quantity,
            purchasePrice: priceInEur,
            currency: 'EUR'
        });
    }
    
    // Record transaction
    const transaction = {
        id: Date.now().toString(),
        type: 'buy',
        assetType: 'crypto',
        symbol: name,
        quantity: quantity,
        price: price,
        total: quantity * price,
        currency: currency,
        date: date,
        timestamp: new Date().toISOString()
    };
    
    addTransaction(transaction);
    saveData();
    renderCrypto();
    renderCryptoTransactions();
    closeBuyCryptoModal();
    
    showNotification(`Successfully bought ${quantity} units of ${name}`, 'success');
}

function handleSellCrypto() {
    const name = document.getElementById('sell-crypto-name').value;
    const quantity = parseFloat(document.getElementById('sell-crypto-quantity').value);
    const price = parseFloat(document.getElementById('sell-crypto-price').value);
    const date = document.getElementById('sell-crypto-date').value;
    
    if (!name || !quantity || !price || !date) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const cryptoIndex = portfolio.crypto.findIndex(c => c.name === name);
    const crypto = portfolio.crypto[cryptoIndex];
    
    if (!crypto || crypto.quantity < quantity) {
        showNotification(`Insufficient amount. You only have ${crypto ? crypto.quantity : 0} units of ${name}`, 'error');
        return;
    }
    
    // Update portfolio
    crypto.quantity -= quantity;
    if (crypto.quantity === 0) {
        portfolio.crypto.splice(cryptoIndex, 1);
    }
    
    // Record transaction
    const transaction = {
        id: Date.now().toString(),
        type: 'sell',
        assetType: 'crypto',
        symbol: name,
        quantity: quantity,
        price: price,
        total: quantity * price,
        currency: 'EUR',
        date: date,
        timestamp: new Date().toISOString()
    };
    
    addTransaction(transaction);
    saveData();
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
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-400">No crypto transactions yet.</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    transactions.forEach(tx => {
        const typeColor = tx.type === 'buy' ? 'text-green-400' : 'text-red-400';
        const typeText = tx.type === 'buy' ? 'Buy' : 'Sell';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 text-gray-300">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="py-2 px-2 ${typeColor}">${typeText}</td>
                <td class="py-2 px-2 text-white font-medium">${tx.symbol}</td>
                <td class="py-2 px-2 text-gray-300">${tx.quantity.toFixed(8)}</td>
                <td class="py-2 px-2 text-gray-300">${formatCurrency(tx.price, tx.currency)}</td>
                <td class="py-2 px-2 text-gray-300">${formatCurrency(tx.total, tx.currency)}</td>
                <td class="py-2 px-2 text-gray-300">${tx.currency}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
    renderCryptoTransactions();
});
