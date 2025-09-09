// ETFs page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const etfModal = document.getElementById('etf-modal');
    const etfForm = document.getElementById('etf-form');
    const etfCancelBtn = document.getElementById('etf-cancel-btn');
    const etfModalTitle = document.getElementById('etf-modal-title');
    // Price update button removed - handled automatically from dashboard
    
    const etfIdInput = document.getElementById('etf-id');
    const etfNameInput = document.getElementById('etf-name');
    const etfQuantityInput = document.getElementById('etf-quantity');
    const etfPurchasePriceInput = document.getElementById('etf-purchase-price');
    const etfCurrencySelect = document.getElementById('etf-currency');
    const etfsTbody = document.getElementById('etfs-tbody');
    
    // Buy/Sell DOM elements
    const buyEtfBtn = document.getElementById('buy-etf-btn');
    const sellEtfBtn = document.getElementById('sell-etf-btn');
    const buyEtfModal = document.getElementById('buy-etf-modal');
    const sellEtfModal = document.getElementById('sell-etf-modal');
    const buyEtfForm = document.getElementById('buy-etf-form');
    const sellEtfForm = document.getElementById('sell-etf-form');
    const buyEtfCancelBtn = document.getElementById('buy-etf-cancel-btn');
    const sellEtfCancelBtn = document.getElementById('sell-etf-cancel-btn');
    const sellEtfSymbolSelect = document.getElementById('sell-etf-symbol');
    const refreshEtfTransactionsBtn = document.getElementById('refresh-etf-transactions-btn');

    // Event listeners
    etfCancelBtn.addEventListener('click', closeEtfModal);
    etfModal.addEventListener('click', (e) => {
        if (e.target === etfModal) closeEtfModal();
    });
    
    etfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEtf();
    });

    // Buy/Sell event listeners
    buyEtfBtn.addEventListener('click', openBuyEtfModal);
    sellEtfBtn.addEventListener('click', openSellEtfModal);
    buyEtfCancelBtn.addEventListener('click', closeBuyEtfModal);
    sellEtfCancelBtn.addEventListener('click', closeSellEtfModal);
    buyEtfModal.addEventListener('click', (e) => {
        if (e.target === buyEtfModal) closeBuyEtfModal();
    });
    sellEtfModal.addEventListener('click', (e) => {
        if (e.target === sellEtfModal) closeSellEtfModal();
    });
    
    buyEtfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleBuyEtf();
    });
    
    sellEtfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSellEtf();
    });
    
    refreshEtfTransactionsBtn.addEventListener('click', renderEtfTransactions);
    
    // Set up auto-calculation for buy form
    setupAutoCalculation('buy-etf-quantity', 'buy-etf-price', 'buy-etf-total');
    setupAutoCalculation('buy-etf-quantity', 'buy-etf-total', 'buy-etf-price');
    
    // Set up auto-calculation for sell form
    setupAutoCalculation('sell-etf-quantity', 'sell-etf-price', 'sell-etf-total');
    setupAutoCalculation('sell-etf-quantity', 'sell-etf-total', 'sell-etf-price');
    
    // Price updates are now handled automatically from the dashboard
    
    // Initial render
    renderEtfs();
});

function openEtfModal(mode = 'add', etf = null) {
    const etfForm = document.getElementById('etf-form');
    const etfModalTitle = document.getElementById('etf-modal-title');
    const etfIdInput = document.getElementById('etf-id');
    const etfNameInput = document.getElementById('etf-name');
    const etfQuantityInput = document.getElementById('etf-quantity');
    const etfPurchasePriceInput = document.getElementById('etf-purchase-price');
    const etfCurrencySelect = document.getElementById('etf-currency');
    
    etfForm.reset();
    etfModalTitle.textContent = mode === 'add' ? 'Add New ETF' : 'Edit ETF';
    etfIdInput.value = etf ? etf.id : '';
    
    if (etf) {
        etfNameInput.value = etf.name;
        etfQuantityInput.value = etf.quantity;
        etfPurchasePriceInput.value = etf.purchasePrice;
        etfCurrencySelect.value = etf.currency;
    } else {
        etfCurrencySelect.value = 'EUR';
    }
    
    document.getElementById('etf-modal').classList.remove('hidden');
}

function closeEtfModal() {
    document.getElementById('etf-modal').classList.add('hidden');
}

function saveEtf() {
    const etfIdInput = document.getElementById('etf-id');
    const etfNameInput = document.getElementById('etf-name');
    const etfQuantityInput = document.getElementById('etf-quantity');
    const etfPurchasePriceInput = document.getElementById('etf-purchase-price');
    const etfCurrencySelect = document.getElementById('etf-currency');
    
    const etfData = {
        id: etfIdInput.value ? parseInt(etfIdInput.value) : Date.now(),
        name: etfNameInput.value.toUpperCase(),
        quantity: parseFloat(etfQuantityInput.value),
        purchasePrice: parseFloat(etfPurchasePriceInput.value),
        currency: etfCurrencySelect.value
    };
    
    if (etfIdInput.value) {
        // Edit existing ETF
        const index = portfolio.etfs.findIndex(e => e.id == etfIdInput.value);
        if (index !== -1) {
            portfolio.etfs[index] = etfData;
        }
    } else {
        // Add new ETF
        portfolio.etfs.push(etfData);
    }
    
    saveData();
    renderEtfs();
    closeEtfModal();
    showNotification('ETF saved successfully!', 'success');
}

function deleteEtf(id) {
    if (confirm('Are you sure you want to delete this ETF?')) {
        portfolio.etfs = portfolio.etfs.filter(e => e.id != id);
        saveData();
        renderEtfs();
        showNotification('ETF deleted successfully!', 'success');
    }
}

function renderEtfs() {
    const etfsTbody = document.getElementById('etfs-tbody');
    const etfsCount = document.getElementById('etfs-count');
    if (!etfsTbody) return;
    
    // Update count
    if (etfsCount) {
        etfsCount.textContent = portfolio.etfs.length;
    }
    
    if (portfolio.etfs.length === 0) {
        etfsTbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-400">No ETFs added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    let totalPnl = 0;
    
    // First pass: calculate total values
    portfolio.etfs.forEach(etf => {
        const cachedData = (priceCache.etfs && priceCache.etfs[etf.name]) || {};
        const currentPrice = cachedData.price || 0;
        const value = currentPrice * etf.quantity;
        const purchaseValue = etf.purchasePrice * etf.quantity;
        const pnl = value - purchaseValue;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (etf.currency === 'USD') {
            valueEur = value / eurUsdRate;
            pnlEur = pnl / eurUsdRate;
        }
        
        totalValue += valueEur;
        totalPnl += pnlEur;
    });
    
    // Second pass: render rows with allocation percentages
    portfolio.etfs.forEach(etf => {
        const cachedData = (priceCache.etfs && priceCache.etfs[etf.name]) || {};
        const currentPrice = cachedData.price || 0;
        const change24h = cachedData.change24h || 0;
        const value = currentPrice * etf.quantity;
        const purchaseValue = etf.purchasePrice * etf.quantity;
        const pnl = value - purchaseValue;
        const pnlPercentage = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
        
        // Convert to EUR for total calculation
        let valueEur = value;
        let pnlEur = pnl;
        if (etf.currency === 'USD') {
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
                    <a href="https://finance.yahoo.com/quote/${etf.name}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">
                        ${etf.name}
                    </a>
                </td>
                <td class="py-2 px-2">${etf.quantity}</td>
                <td class="py-2 px-2">${formatCurrency(etf.purchasePrice, etf.currency)}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(currentPrice, etf.currency) : '--'}</td>
                <td class="py-2 px-2 ${change24hClass}">${change24hDisplay}</td>
                <td class="py-2 px-2">${currentPrice > 0 ? formatCurrency(value, etf.currency) : '--'}</td>
                <td class="py-2 px-2">${allocationPercentage.toFixed(1)}%</td>
                <td class="py-2 px-2 ${pnlClass}">
                    ${currentPrice > 0 ? `${pnlSign}${formatCurrency(pnl, etf.currency)} (${pnlSign}${pnlPercentage.toFixed(2)}%)` : '--'}
                </td>
                <td class="py-2 px-2">
                    <button onclick="editEtf(${etf.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</button>
                    <button onclick="deleteEtf(${etf.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Add total row
    if (portfolio.etfs.length > 0) {
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
    
    etfsTbody.innerHTML = html;
}

function editEtf(id) {
    const etf = portfolio.etfs.find(e => e.id == id);
    if (etf) {
        openEtfModal('edit', etf);
    }
}

async function updateEtfPrices() {
    const getEtfsPricesBtn = document.getElementById('get-etfs-prices-btn');
    if (getEtfsPricesBtn) {
        getEtfsPricesBtn.disabled = true;
        getEtfsPricesBtn.textContent = 'Updating...';
    }
    
    let updatedCount = 0;
    const promises = portfolio.etfs.map(async (etf) => {
        try {
            const price = await fetchStockPrice(etf.name);
            if (price) {
                if (!priceCache.etfs) priceCache.etfs = {};
                priceCache.etfs[etf.name] = price;
                updatedCount++;
            }
        } catch (error) {
            console.error(`Error fetching price for ${etf.name}:`, error);
        }
    });
    
    await Promise.all(promises);
    savePriceCache();
    renderEtfs();
    
    if (getEtfsPricesBtn) {
        getEtfsPricesBtn.disabled = false;
        getEtfsPricesBtn.textContent = 'Update Prices';
    }
    
    showNotification(`Updated prices for ${updatedCount} ETFs`, 'success');
}

// Notes functionality
function initializeNotes() {
    const notesTextarea = document.getElementById('etfs-notes');
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
    const notesTextarea = document.getElementById('etfs-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const notes = localStorage.getItem('etfsNotes') || '';
        notesTextarea.value = notes;
        updateCharCount();
    }
}

function autoSaveNotes() {
    const notesTextarea = document.getElementById('etfs-notes');
    
    if (notesTextarea) {
        const notes = notesTextarea.value;
        localStorage.setItem('etfsNotes', notes);
    }
}

function updateCharCount() {
    const notesTextarea = document.getElementById('etfs-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const count = notesTextarea.value.length;
        charCount.textContent = count;
    }
}

// Buy/Sell functionality
function openBuyEtfModal() {
    const modal = document.getElementById('buy-etf-modal');
    const dateInput = document.getElementById('buy-etf-date');
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeBuyEtfModal() {
    const modal = document.getElementById('buy-etf-modal');
    modal.classList.add('hidden');
    document.getElementById('buy-etf-form').reset();
}

function openSellEtfModal() {
    const modal = document.getElementById('sell-etf-modal');
    const dateInput = document.getElementById('sell-etf-date');
    const symbolSelect = document.getElementById('sell-etf-symbol');
    
    // Populate ETF symbols dropdown
    symbolSelect.innerHTML = '<option value="">Select an ETF to sell</option>';
    if (portfolio.etfs) {
        portfolio.etfs.forEach(etf => {
            if (etf.quantity > 0) {
                const option = document.createElement('option');
                option.value = etf.name;
                option.textContent = `${etf.name} (${etf.quantity} shares)`;
                symbolSelect.appendChild(option);
            }
        });
    }
    
    dateInput.value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
}

function closeSellEtfModal() {
    const modal = document.getElementById('sell-etf-modal');
    modal.classList.add('hidden');
    document.getElementById('sell-etf-form').reset();
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

function handleBuyEtf() {
    const symbol = document.getElementById('buy-etf-symbol').value.trim().toUpperCase();
    const quantity = parseFloat(document.getElementById('buy-etf-quantity').value);
    const price = parseFloat(document.getElementById('buy-etf-price').value);
    const total = parseFloat(document.getElementById('buy-etf-total').value);
    const currency = document.getElementById('buy-etf-currency').value;
    const date = document.getElementById('buy-etf-date').value;
    const note = document.getElementById('buy-etf-note').value.trim();
    
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
    let priceInEur = price;
    if (currency === 'USD') {
        priceInEur = price / eurUsdRate;
    }
    
    // Add to portfolio
    if (!portfolio.etfs) portfolio.etfs = [];
    
    const existingEtfIndex = portfolio.etfs.findIndex(etf => etf.name === symbol);
    
    if (existingEtfIndex !== -1) {
        // Update existing ETF
        const existingEtf = portfolio.etfs[existingEtfIndex];
        const totalQuantity = existingEtf.quantity + quantity;
        const totalCost = (existingEtf.quantity * existingEtf.purchasePrice) + (quantity * price);
        const averagePrice = totalCost / totalQuantity;
        
        portfolio.etfs[existingEtfIndex] = {
            ...existingEtf,
            quantity: totalQuantity,
            purchasePrice: averagePrice
        };
    } else {
        // Add new ETF
        portfolio.etfs.push({
            name: symbol,
            quantity: quantity,
            purchasePrice: priceInEur,
            currency: 'EUR'
        });
    }
    
    // Record transaction
    const transaction = {
        id: Date.now().toString(),
        type: 'buy',
        assetType: 'etfs',
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
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderEtfs();
    renderEtfTransactions();
    closeBuyEtfModal();
    
    showNotification(`Successfully bought ${quantity} shares of ${symbol}`, 'success');
}

function handleSellEtf() {
    const symbol = document.getElementById('sell-etf-symbol').value;
    const quantity = parseFloat(document.getElementById('sell-etf-quantity').value);
    const price = parseFloat(document.getElementById('sell-etf-price').value);
    const total = parseFloat(document.getElementById('sell-etf-total').value);
    const currency = document.getElementById('sell-etf-currency').value;
    const date = document.getElementById('sell-etf-date').value;
    const note = document.getElementById('sell-etf-note').value.trim();
    
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
        assetType: 'etfs',
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
    // Recalculate portfolio from transactions (source of truth)
    calculatePortfolioFromTransactions();
    renderEtfs();
    renderEtfTransactions();
    closeSellEtfModal();
    
    showNotification(`Successfully sold ${quantity} shares of ${symbol}`, 'success');
}

// Transaction history rendering
function renderEtfTransactions() {
    const tbody = document.getElementById('etf-transactions-tbody');
    if (!tbody) return;
    
    const transactions = loadTransactions().filter(tx => tx.assetType === 'etfs');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-400">No ETF transactions yet.</td></tr>';
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
                        <button onclick="editEtfTransaction('${tx.id}')" class="glass-button text-xs px-2 py-1" title="Edit">
                            ✏️
                        </button>
                        <button onclick="deleteEtfTransaction('${tx.id}')" class="glass-button glass-button-danger text-xs px-2 py-1" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Edit ETF transaction
function editEtfTransaction(transactionId) {
    const transactions = loadTransactions();
    const transaction = transactions.find(tx => tx.id === transactionId);
    
    if (!transaction) {
        showNotification('Transaction not found', 'error');
        return;
    }
    
    // Populate the edit modal
    document.getElementById('edit-etf-transaction-id').value = transaction.id;
    document.getElementById('edit-etf-transaction-type').value = transaction.type;
    document.getElementById('edit-etf-transaction-symbol').value = transaction.symbol;
    document.getElementById('edit-etf-transaction-quantity').value = transaction.quantity;
    document.getElementById('edit-etf-transaction-price').value = transaction.price;
    document.getElementById('edit-etf-transaction-currency').value = transaction.currency;
    document.getElementById('edit-etf-transaction-date').value = transaction.date;
    document.getElementById('edit-etf-transaction-note').value = transaction.note || '';
    
    // Show the modal
    document.getElementById('edit-etf-transaction-modal').classList.remove('hidden');
}

// Delete ETF transaction
function deleteEtfTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }
    
    const transactions = loadTransactions();
    const updatedTransactions = transactions.filter(tx => tx.id !== transactionId);
    saveTransactions(updatedTransactions);
    
    // Recalculate portfolio
    calculatePortfolioFromTransactions();
    renderEtfs();
    renderEtfTransactions();
    
    showNotification('Transaction deleted successfully', 'success');
}

// Handle edit ETF transaction form submission
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-etf-transaction-form');
    const editCancelBtn = document.getElementById('edit-etf-transaction-cancel-btn');
    
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const transactionId = document.getElementById('edit-etf-transaction-id').value;
            const type = document.getElementById('edit-etf-transaction-type').value;
            const symbol = document.getElementById('edit-etf-transaction-symbol').value.toUpperCase();
            const quantity = parseFloat(document.getElementById('edit-etf-transaction-quantity').value);
            const price = parseFloat(document.getElementById('edit-etf-transaction-price').value);
            const currency = document.getElementById('edit-etf-transaction-currency').value;
            const date = document.getElementById('edit-etf-transaction-date').value;
            const note = document.getElementById('edit-etf-transaction-note').value.trim();
            
            if (!symbol || !quantity || !price || !date) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
    // Convert to EUR if needed
    let priceInEur = finalPrice;
    let totalInEur = finalTotal;
    if (currency === 'USD') {
        priceInEur = finalPrice / eurUsdRate;
        totalInEur = finalTotal / eurUsdRate;
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
                total,
                currency: 'EUR', // Always store in EUR
                originalPrice: currency === 'USD' ? price : null,
                originalCurrency: currency === 'USD' ? 'USD' : null,
                date,
                note: note || transactions[transactionIndex].note,
                timestamp: new Date().toISOString()
            };
            
            saveTransactions(transactions);
            
            // Recalculate portfolio
            calculatePortfolioFromTransactions();
            renderEtfs();
            renderEtfTransactions();
            
            // Close modal
            document.getElementById('edit-etf-transaction-modal').classList.add('hidden');
            
            showNotification('Transaction updated successfully', 'success');
        });
    }
    
    if (editCancelBtn) {
        editCancelBtn.addEventListener('click', () => {
            document.getElementById('edit-etf-transaction-modal').classList.add('hidden');
        });
    }
});

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
    renderEtfTransactions();
});
