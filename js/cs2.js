// CS2 page functionality with dynamic portfolio management
//
// API INTEGRATION:
// - Supports two modes: Manual and API
// - Manual mode: User enters all values manually (default behavior)
// - API mode: Fetches data from Pricempire API (https://api.pricempire.com/v4/trader/portfolios)
//   - API returns: id, name, slug, currency, value, change24h, change24h_percentage, 
//     items_count, total_invested, profit_loss, roi
//   - Decimal adjustment: API values are divided by 100 (except percentages)
//   - Realized P&L remains manually editable in both modes (not provided by API)
//   - Value field is readonly in API mode
//   - Additional API fields displayed: 24h change, items count, total invested, 
//     unrealized P&L, ROI
// - Mode preference saved in localStorage as 'cs2ApiMode'

// Global DOM elements
let portfoliosContainer;
let totalCs2Usd;
let totalCs2Eur;
let editingMarketplace = null;
let isApiMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addPortfolioBtn = document.getElementById('add-portfolio-btn');
    const addPortfolioModal = document.getElementById('add-portfolio-modal');
    const addPortfolioForm = document.getElementById('add-portfolio-form');
    const cancelAddPortfolio = document.getElementById('cancel-add-portfolio');
    const apiModeToggle = document.getElementById('api-mode-toggle');
    const modeText = document.getElementById('mode-text');
    const fetchApiBtn = document.getElementById('fetch-api-btn');
    
    // Initialize global DOM elements
    portfoliosContainer = document.getElementById('portfolios-container');
    totalCs2Usd = document.getElementById('total-cs2-usd');
    totalCs2Eur = document.getElementById('total-cs2-eur');
    
    // Load saved mode preference
    const savedMode = localStorage.getItem('cs2ApiMode');
    isApiMode = savedMode === 'api';
    apiModeToggle.checked = isApiMode;
    modeText.textContent = isApiMode ? 'API' : 'Manual';
    addPortfolioBtn.style.display = isApiMode ? 'none' : 'inline-block';
    fetchApiBtn.style.display = isApiMode ? 'inline-block' : 'none';
    
    // Event listeners
    addPortfolioBtn.addEventListener('click', () => showAddPortfolioModal());
    cancelAddPortfolio.addEventListener('click', () => hideAddPortfolioModal());
    addPortfolioForm.addEventListener('submit', handleAddPortfolio);
    
    // API mode toggle
    apiModeToggle.addEventListener('change', () => {
        isApiMode = apiModeToggle.checked;
        modeText.textContent = isApiMode ? 'API' : 'Manual';
        localStorage.setItem('cs2ApiMode', isApiMode ? 'api' : 'manual');
        addPortfolioBtn.style.display = isApiMode ? 'none' : 'inline-block';
        fetchApiBtn.style.display = isApiMode ? 'inline-block' : 'none';
        
        if (isApiMode) {
            fetchPricempireData(false); // Use cache if available
        } else {
            renderPortfolios();
        }
    });
    
    // Fetch API data button (force=true to bypass cache)
    fetchApiBtn.addEventListener('click', () => fetchPricempireData(true));
    
    // Initialize CS2 portfolios
    initializePortfolios();
    
    // Note: Auto-fetch is now handled by startScheduledUpdates() in shared.js
    // which runs every hour across all pages when cs2ApiMode === 'api'
    
    // Pending Funds functionality
    const togglePendingFundsBtn = document.getElementById('toggle-pending-funds-btn');
    const addPendingFundsBtn = document.getElementById('add-pending-funds-btn');
    const pendingFundsContainer = document.getElementById('pending-funds-container');
    const pendingFundsToggleText = document.getElementById('pending-funds-toggle-text');
    const pendingFundsModal = document.getElementById('pending-funds-modal');
    const pendingFundsForm = document.getElementById('pending-funds-form');
    const cancelPendingFunds = document.getElementById('cancel-pending-funds');
    
    let pendingFundsVisible = false;
    
    togglePendingFundsBtn.addEventListener('click', () => {
        pendingFundsVisible = !pendingFundsVisible;
        
        if (pendingFundsVisible) {
            pendingFundsContainer.classList.remove('hidden');
            pendingFundsToggleText.textContent = 'Hide';
            addPendingFundsBtn.style.display = 'inline-block';
            renderPendingFunds();
        } else {
            pendingFundsContainer.classList.add('hidden');
            pendingFundsToggleText.textContent = 'Show';
            addPendingFundsBtn.style.display = 'none';
        }
    });
    
    addPendingFundsBtn.addEventListener('click', () => {
        editingMarketplace = null;
        document.getElementById('pending-funds-modal-title').textContent = 'Add Marketplace Funds';
        document.getElementById('marketplace-name').value = '';
        document.getElementById('funds-amount').value = '';
        pendingFundsModal.classList.remove('hidden');
    });
    
    cancelPendingFunds.addEventListener('click', () => {
        pendingFundsModal.classList.add('hidden');
    });
    
    pendingFundsModal.addEventListener('click', (e) => {
        if (e.target === pendingFundsModal) {
            pendingFundsModal.classList.add('hidden');
        }
    });
    
    pendingFundsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handlePendingFundsSubmit();
    });
});

// Color themes for portfolios
const colorThemes = {
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-400', border: 'border-blue-500' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-400', border: 'border-purple-500' },
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-400', border: 'border-green-500' },
    red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', text: 'text-red-400', border: 'border-red-500' },
    yellow: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-700', text: 'text-yellow-400', border: 'border-yellow-500' },
    pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', text: 'text-pink-400', border: 'border-pink-500' },
    indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-400', border: 'border-indigo-500' },
    orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-400', border: 'border-orange-500' }
};

function initializePortfolios() {
    // Initialize CS2 structure if it doesn't exist
    if (!portfolio.cs2) {
        portfolio.cs2 = { portfolios: {} };
    }
    
    // If we have old structure, migrate it
    if (portfolio.cs2.playItems || portfolio.cs2.investmentItems) {
        migrateOldStructure();
    }
    
    // Ensure portfolios object exists
    if (!portfolio.cs2.portfolios) {
        portfolio.cs2.portfolios = {};
    }
    
    // Create default portfolios if none exist
    if (Object.keys(portfolio.cs2.portfolios).length === 0) {
        createDefaultPortfolios();
    }
    
    renderPortfolios();
    updateCombinedDisplay();
    updateCS2RealizedPnLDisplay();
}

function migrateOldStructure() {
    const portfolios = {};
    
    if (portfolio.cs2.playItems) {
        portfolios['playItems'] = {
            name: 'Play Items',
            description: 'Items for playing',
            color: 'blue',
            value: portfolio.cs2.playItems.value || 0,
            realizedPnl: 0,
            currency: 'USD'
        };
    }
    
    if (portfolio.cs2.investmentItems) {
        portfolios['investmentItems'] = {
            name: 'Investment Items',
            description: 'Items for investment',
            color: 'purple',
            value: portfolio.cs2.investmentItems.value || 0,
            realizedPnl: 0,
            currency: 'USD'
        };
    }
    
    portfolio.cs2.portfolios = portfolios;
    
    // Clean up old structure
    delete portfolio.cs2.playItems;
    delete portfolio.cs2.investmentItems;
    
    saveData();
}

function createDefaultPortfolios() {
    portfolio.cs2.portfolios = {
        'playItems': {
            name: 'Play Items',
            description: 'Items for playing',
            color: 'blue',
            value: 0,
            realizedPnl: 0,
            currency: 'USD'
        },
        'investmentItems': {
            name: 'Investment Items',
            description: 'Items for investment',
            color: 'purple',
            value: 0,
            realizedPnl: 0,
            currency: 'USD'
        }
    };
    saveData();
}

// Cache duration: 1 hour (same as other APIs)
const PRICEMPIRE_CACHE_DURATION = 60 * 60 * 1000;

function getCachedPricempireData() {
    try {
        const cached = localStorage.getItem('portfolioPilotPricempireCache');
        if (cached) {
            const parsed = JSON.parse(cached);
            const now = Date.now();
            // Check if cache is still valid (less than 1 hour old)
            if (parsed.timestamp && (now - parsed.timestamp) < PRICEMPIRE_CACHE_DURATION) {
                console.log('Using cached Pricempire data (age: ' + Math.round((now - parsed.timestamp) / 60000) + ' minutes)');
                return parsed.data;
            }
        }
    } catch (e) {
        console.error('Error loading Pricempire cache:', e);
    }
    return null;
}

function savePricempireCache(data) {
    try {
        const cacheObject = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem('portfolioPilotPricempireCache', JSON.stringify(cacheObject));
        console.log('Pricempire data cached successfully');
    } catch (e) {
        console.error('Error saving Pricempire cache:', e);
    }
}

async function fetchPricempireData(force = false) {
    try {
        // Check cache first unless force is true
        if (!force) {
            const cachedData = getCachedPricempireData();
            if (cachedData) {
                applyPricempireData(cachedData);
                return;
            }
        }
        
        const apiKey = getApiKey('pricempire');
        if (!apiKey) {
            showNotification('Pricempire API key not found. Please configure it in settings.', 'error');
            return;
        }
        
        showNotification('Fetching data from Pricempire...', 'info');
        
        const response = await fetch('https://api.pricempire.com/v4/trader/portfolios', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response format
        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid response format from Pricempire API');
        }
        
        // Track API usage
        trackApiUsage('Pricempire');
        
        // Save to cache
        savePricempireCache(data);
        
        // Apply the data
        applyPricempireData(data);
        
        showNotification(`Successfully fetched ${data.length} portfolio(s) from Pricempire`, 'success');
    } catch (error) {
        console.error('Error fetching Pricempire data:', error);
        showNotification(`Failed to fetch data: ${error.message}`, 'error');
    }
}

function applyPricempireData(data) {
    // Map API portfolios to our structure
    const newPortfolios = {};
    const colorKeys = Object.keys(colorThemes);
    
    data.forEach((apiPortfolio, index) => {
        // Generate unique ID from API portfolio ID or slug
        const id = apiPortfolio.slug || `portfolio-${apiPortfolio.id}`;
        
        // Preserve existing realizedPnl if portfolio exists
        const existingRealizedPnl = portfolio.cs2.portfolios[id]?.realizedPnl || 0;
        
        // Map API data to our structure - divide by 100 for decimal adjustment
        newPortfolios[id] = {
            name: apiPortfolio.name || `Portfolio ${index + 1}`,
            description: `${apiPortfolio.items_count || 0} items`,
            color: colorKeys[index % colorKeys.length], // Cycle through colors
            value: (apiPortfolio.value || 0) / 100,
            realizedPnl: existingRealizedPnl, // Keep manual value
            currency: apiPortfolio.currency || 'USD',
            // Additional API fields (also divide by 100)
            change24h: (apiPortfolio.change24h || 0) / 100,
            change24h_percentage: apiPortfolio.change24h_percentage || 0, // Percentage, not divided
            items_count: apiPortfolio.items_count || 0,
            total_invested: (apiPortfolio.total_invested || 0) / 100,
            profit_loss: (apiPortfolio.profit_loss || 0) / 100,
            roi: apiPortfolio.roi || 0, // ROI percentage, not divided
            apiManaged: true // Flag to indicate this came from API
        };
    });
    
    portfolio.cs2.portfolios = newPortfolios;
    saveData();
    renderPortfolios();
    updateCombinedDisplay();
    updateCS2RealizedPnLDisplay();
}

function renderPortfolios() {
    portfoliosContainer.innerHTML = '';
    
    Object.entries(portfolio.cs2.portfolios).forEach(([id, portfolioData]) => {
        const portfolioElement = createPortfolioElement(id, portfolioData);
        portfoliosContainer.appendChild(portfolioElement);
    });
}

function createPortfolioElement(id, portfolioData) {
    const theme = colorThemes[portfolioData.color];
    const isApiManaged = portfolioData.apiManaged && isApiMode;
    
    const portfolioDiv = document.createElement('div');
    portfolioDiv.className = 'bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg';
    
    // Build additional API fields HTML if they exist
    let apiFieldsHtml = '';
    if (isApiManaged) {
        apiFieldsHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                ${portfolioData.change24h !== undefined ? `
                    <div>
                        <label class="block text-sm font-medium mb-1">24h Change</label>
                        <div class="bg-gray-700 p-3 rounded-lg ${portfolioData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            ${portfolioData.change24h >= 0 ? '+' : ''}${formatCurrency(portfolioData.change24h, 'USD')} 
                            (${portfolioData.change24h_percentage >= 0 ? '+' : ''}${portfolioData.change24h_percentage?.toFixed(2)}%)
                        </div>
                    </div>
                ` : ''}
                ${portfolioData.items_count !== undefined ? `
                    <div>
                        <label class="block text-sm font-medium mb-1">Items Count</label>
                        <div class="bg-gray-700 p-3 rounded-lg text-gray-300">
                            ${portfolioData.items_count}
                        </div>
                    </div>
                ` : ''}
                ${portfolioData.total_invested !== undefined ? `
                    <div>
                        <label class="block text-sm font-medium mb-1">Total Invested</label>
                        <div class="bg-gray-700 p-3 rounded-lg text-gray-300">
                            ${formatCurrency(portfolioData.total_invested, 'USD')}
                        </div>
                    </div>
                ` : ''}
                ${portfolioData.profit_loss !== undefined ? `
                    <div>
                        <label class="block text-sm font-medium mb-1">Unrealized P&L</label>
                        <div class="bg-gray-700 p-3 rounded-lg ${portfolioData.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            ${portfolioData.profit_loss >= 0 ? '+' : ''}${formatCurrency(portfolioData.profit_loss, 'USD')}
                        </div>
                    </div>
                ` : ''}
                ${portfolioData.roi !== undefined ? `
                    <div>
                        <label class="block text-sm font-medium mb-1">ROI</label>
                        <div class="bg-gray-700 p-3 rounded-lg ${portfolioData.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            ${portfolioData.roi >= 0 ? '+' : ''}${portfolioData.roi?.toFixed(2)}%
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    portfolioDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold ${theme.text}">${portfolioData.name}</h3>
            <div class="flex items-center gap-2">
                <div class="text-sm text-gray-400">${portfolioData.description}</div>
                ${!isApiManaged ? `
                    <button onclick="removePortfolio('${id}')" class="text-red-400 hover:text-red-300 text-sm font-medium">
                        Remove
                    </button>
                ` : ''}
            </div>
        </div>
        ${apiFieldsHtml}
        <div class="flex flex-col gap-4">
            <div>
                <label for="${id}-input" class="block text-sm font-medium mb-2">Value (USD)</label>
                <input type="number" id="${id}-input" step="any" placeholder="0.00" 
                       ${isApiManaged ? 'readonly' : ''}
                       class="w-full ${isApiManaged ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'} p-3 rounded-lg border border-gray-600 focus:outline-none focus:${theme.border} text-lg">
            </div>
            <div>
                <label for="${id}-realized-pnl-input" class="block text-sm font-medium mb-2">Realized P&L (USD)</label>
                <input type="number" id="${id}-realized-pnl-input" step="any" placeholder="0.00" 
                       class="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:${theme.border} text-lg">
            </div>
            ${!isApiManaged ? `
                <button onclick="savePortfolio('${id}')" 
                        class="${theme.bg} ${theme.hover} text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                    Save ${portfolioData.name}
                </button>
            ` : `
                <button onclick="savePortfolioRealizedPnL('${id}')" 
                        class="${theme.bg} ${theme.hover} text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                    Save Realized P&L
                </button>
            `}
        </div>
        <div class="mt-4 p-3 bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-300 mb-2">
                <strong>Current Value:</strong> <span id="${id}-current" class="${theme.text}">$0.00</span>
            </div>
            <div class="text-sm text-gray-300">
                <strong>Realized P&L:</strong> <span id="${id}-realized-pnl-display" class="${portfolioData.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}">$0.00</span> <span id="${id}-realized-pnl-eur-display" class="text-gray-400">(€0.00)</span>
            </div>
        </div>
    `;
    
    // Set current value and realized P&L
    const input = portfolioDiv.querySelector(`#${id}-input`);
    const realizedPnlInput = portfolioDiv.querySelector(`#${id}-realized-pnl-input`);
    const current = portfolioDiv.querySelector(`#${id}-current`);
    const realizedPnlDisplay = portfolioDiv.querySelector(`#${id}-realized-pnl-display`);
    const realizedPnlEurDisplay = portfolioDiv.querySelector(`#${id}-realized-pnl-eur-display`);
    input.value = portfolioData.value || '';
    realizedPnlInput.value = portfolioData.realizedPnl || '';
    current.textContent = formatCurrency(portfolioData.value || 0, 'USD');
    realizedPnlDisplay.textContent = formatCurrency(portfolioData.realizedPnl || 0, 'USD');
    realizedPnlEurDisplay.textContent = `(€${formatCurrency(portfolioData.realizedPnl / eurUsdRate || 0, 'EUR').replace('€', '')})`;
    
    return portfolioDiv;
}

function savePortfolio(id) {
    const input = document.getElementById(`${id}-input`);
    const realizedPnlInput = document.getElementById(`${id}-realized-pnl-input`);
    const value = parseFloat(input.value) || 0;
    const realizedPnl = parseFloat(realizedPnlInput.value) || 0;
    
    // Track value change for realized P&L calculation
    const previousValue = portfolio.cs2.portfolios[id].value || 0;
    const valueChange = value - previousValue;
    
    // Create transaction record for value change
    if (valueChange !== 0) {
        const transaction = {
            id: Date.now().toString(),
            type: 'value_update',
            assetType: 'cs2',
            symbol: id,
            quantity: 1, // CS2 doesn't use quantity
            price: value,
            total: value,
            currency: 'USD',
            originalPrice: value,
            originalCurrency: 'USD',
            historicalRate: eurUsdRate, // Use current rate since it's a current value update
            previousValue: previousValue,
            currentValue: value,
            date: new Date().toISOString().split('T')[0],
            note: `Updated ${portfolio.cs2.portfolios[id].name} value from $${previousValue.toFixed(2)} to $${value.toFixed(2)}`,
            timestamp: new Date().toISOString()
        };
        
        addTransaction(transaction);
    }
    
    portfolio.cs2.portfolios[id].value = value;
    portfolio.cs2.portfolios[id].realizedPnl = realizedPnl;
    updateCombinedTotal();
    saveData();
    updateCombinedDisplay();
    updateCS2RealizedPnLDisplay();
    
    // Update the realized P&L display
    const realizedPnlDisplay = document.getElementById(`${id}-realized-pnl-display`);
    const realizedPnlEurDisplay = document.getElementById(`${id}-realized-pnl-eur-display`);
    if (realizedPnlDisplay) {
        realizedPnlDisplay.textContent = formatCurrency(realizedPnl, 'USD');
        realizedPnlDisplay.className = realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
    }
    if (realizedPnlEurDisplay) {
        realizedPnlEurDisplay.textContent = `(€${formatCurrency(realizedPnl / eurUsdRate, 'EUR').replace('€', '')})`;
    }
    
    showNotification(`${portfolio.cs2.portfolios[id].name} value saved successfully!`, 'success');
}

function savePortfolioRealizedPnL(id) {
    const realizedPnlInput = document.getElementById(`${id}-realized-pnl-input`);
    const realizedPnl = parseFloat(realizedPnlInput.value) || 0;
    
    portfolio.cs2.portfolios[id].realizedPnl = realizedPnl;
    saveData();
    updateCS2RealizedPnLDisplay();
    
    // Update the realized P&L display
    const realizedPnlDisplay = document.getElementById(`${id}-realized-pnl-display`);
    const realizedPnlEurDisplay = document.getElementById(`${id}-realized-pnl-eur-display`);
    if (realizedPnlDisplay) {
        realizedPnlDisplay.textContent = formatCurrency(realizedPnl, 'USD');
        realizedPnlDisplay.className = realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
    }
    if (realizedPnlEurDisplay) {
        realizedPnlEurDisplay.textContent = `(€${formatCurrency(realizedPnl / eurUsdRate, 'EUR').replace('€', '')})`;
    }
    
    showNotification(`${portfolio.cs2.portfolios[id].name} Realized P&L saved successfully!`, 'success');
}

function removePortfolio(id) {
    if (Object.keys(portfolio.cs2.portfolios).length <= 1) {
        showNotification('You must have at least one portfolio!', 'error');
        return;
    }
    
    const portfolioName = portfolio.cs2.portfolios[id].name;
    if (confirm(`Are you sure you want to remove the "${portfolioName}" portfolio?`)) {
        delete portfolio.cs2.portfolios[id];
        updateCombinedTotal();
        saveData();
        renderPortfolios();
        updateCombinedDisplay();
        showNotification(`${portfolioName} portfolio removed successfully!`, 'success');
    }
}

function showAddPortfolioModal() {
    document.getElementById('add-portfolio-modal').classList.remove('hidden');
    document.getElementById('portfolio-name').focus();
}

function hideAddPortfolioModal() {
    document.getElementById('add-portfolio-modal').classList.add('hidden');
    document.getElementById('add-portfolio-form').reset();
}

function handleAddPortfolio(e) {
    e.preventDefault();
    
    const name = document.getElementById('portfolio-name').value.trim();
    const description = document.getElementById('portfolio-description').value.trim();
    const color = document.getElementById('portfolio-color').value;
    
    if (!name) {
        showNotification('Portfolio name is required!', 'error');
        return;
    }
    
    // Check if name already exists
    const existingNames = Object.values(portfolio.cs2.portfolios).map(p => p.name.toLowerCase());
    if (existingNames.includes(name.toLowerCase())) {
        showNotification('A portfolio with this name already exists!', 'error');
        return;
    }
    
    // Create new portfolio ID
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Add new portfolio
    portfolio.cs2.portfolios[id] = {
        name: name,
        description: description || 'Custom portfolio',
        color: color,
        value: 0,
        currency: 'USD'
    };
    
    saveData();
    renderPortfolios();
    updateCombinedDisplay();
    hideAddPortfolioModal();
    
    showNotification(`${name} portfolio added successfully!`, 'success');
}

function updateCombinedTotal() {
    if (!portfolio.cs2.portfolios) return;
    
    const totalUsd = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => sum + (p.value || 0), 0);
    
    // Convert to EUR using the current exchange rate
    const totalEur = totalUsd / eurUsdRate;
    
    // Save the combined total
    portfolio.cs2.value = totalEur;
    portfolio.cs2.currency = 'EUR';
}

function updateCombinedDisplay() {
    if (!portfolio.cs2.portfolios) return;
    
    // Calculate active items total
    const activeItemsUsd = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => sum + (p.value || 0), 0);
    
    // Calculate pending funds total
    const pendingFundsUsd = portfolio.cs2.pendingFunds ? portfolio.cs2.pendingFunds.total : 0;
    
    // Total CS2 exposure
    const totalUsd = activeItemsUsd + pendingFundsUsd;
    const totalEur = totalUsd / eurUsdRate;
    
    // Update displays
    totalCs2Usd.textContent = formatCurrency(totalUsd, 'USD');
    totalCs2Eur.textContent = formatCurrency(totalEur, 'EUR');
    
    // Update active items display
    const activeItemsDisplay = document.getElementById('active-items-usd');
    if (activeItemsDisplay) {
        activeItemsDisplay.textContent = formatCurrency(activeItemsUsd, 'USD');
    }
}


function updateCS2RealizedPnLDisplay() {
    const transactions = loadTransactions();
    const realizedPnL = calculateRealizedPnL(transactions);
    
    // Calculate CS2 realized P&L by portfolio
    const cs2Transactions = transactions.filter(tx => tx.assetType === 'cs2');
    const portfolioPnL = {};
    
    cs2Transactions.forEach(tx => {
        if (!portfolioPnL[tx.symbol]) {
            portfolioPnL[tx.symbol] = 0;
        }
        portfolioPnL[tx.symbol] += (tx.currentValue || 0) - (tx.previousValue || 0);
    });
    
    // Update individual portfolio P&L displays
    const playItemsElement = document.getElementById('play-items-realized-pnl');
    const investmentItemsElement = document.getElementById('investment-items-realized-pnl');
    const totalUsdElement = document.getElementById('cs2-total-realized-pnl-usd');
    const totalEurElement = document.getElementById('cs2-total-realized-pnl-eur');
    
    const playItemsPnL = portfolioPnL['playItems'] || 0;
    const investmentItemsPnL = portfolioPnL['investmentItems'] || 0;
    const totalPnLUsd = playItemsPnL + investmentItemsPnL;
    const totalPnLEur = totalPnLUsd / eurUsdRate;
    
    if (playItemsElement) {
        const playItemsClass = playItemsPnL >= 0 ? 'text-emerald-400' : 'text-red-400';
        playItemsElement.className = `text-lg font-semibold ${playItemsClass}`;
        playItemsElement.textContent = formatCurrency(playItemsPnL, 'USD');
    }
    
    if (investmentItemsElement) {
        const investmentItemsClass = investmentItemsPnL >= 0 ? 'text-emerald-400' : 'text-red-400';
        investmentItemsElement.className = `text-lg font-semibold ${investmentItemsClass}`;
        investmentItemsElement.textContent = formatCurrency(investmentItemsPnL, 'USD');
    }
    
    if (totalUsdElement) {
        const totalUsdClass = totalPnLUsd >= 0 ? 'text-emerald-400' : 'text-red-400';
        totalUsdElement.className = `text-lg font-semibold ${totalUsdClass}`;
        totalUsdElement.textContent = formatCurrency(totalPnLUsd, 'USD');
    }
    
    if (totalEurElement) {
        const totalEurClass = totalPnLEur >= 0 ? 'text-emerald-400' : 'text-red-400';
        totalEurElement.className = `text-lg font-semibold ${totalEurClass}`;
        totalEurElement.textContent = formatCurrency(totalPnLEur, 'EUR');
    }
}

// Make functions globally available for onclick handlers
window.savePortfolio = savePortfolio;
window.savePortfolioRealizedPnL = savePortfolioRealizedPnL;
window.removePortfolio = removePortfolio;

// Notes functionality
function initializeNotes() {
    const notesTextarea = document.getElementById('cs2-notes');
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
    const notesTextarea = document.getElementById('cs2-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const notes = localStorage.getItem('cs2Notes') || '';
        notesTextarea.value = notes;
        updateCharCount();
    }
}

function autoSaveNotes() {
    const notesTextarea = document.getElementById('cs2-notes');
    
    if (notesTextarea) {
        const notes = notesTextarea.value;
        localStorage.setItem('cs2Notes', notes);
    }
}

function updateCharCount() {
    const notesTextarea = document.getElementById('cs2-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const count = notesTextarea.value.length;
        charCount.textContent = count;
    }
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeNotes();
});

// Pending Funds Functions
function handlePendingFundsSubmit() {
    const marketplaceName = document.getElementById('marketplace-name').value.trim();
    const amount = parseFloat(document.getElementById('funds-amount').value);
    
    if (!marketplaceName || isNaN(amount) || amount <= 0) {
        showNotification('Please enter valid marketplace name and amount', 'error');
        return;
    }
    
    if (editingMarketplace) {
        // Update existing marketplace
        removePendingFunds(editingMarketplace);
    }
    
    addPendingFunds(marketplaceName, amount);
    renderPendingFunds();
    updateCombinedDisplay();
    
    document.getElementById('pending-funds-modal').classList.add('hidden');
    showNotification(`Marketplace funds ${editingMarketplace ? 'updated' : 'added'} successfully!`, 'success');
}

function renderPendingFunds() {
    const pendingFundsList = document.getElementById('pending-funds-list');
    const pendingFundsEmpty = document.getElementById('pending-funds-empty');
    const totalPendingFundsUsd = document.getElementById('total-pending-funds-usd');
    const totalPendingFundsEur = document.getElementById('total-pending-funds-eur');
    
    if (!portfolio.cs2.pendingFunds || !portfolio.cs2.pendingFunds.breakdown) {
        portfolio.cs2.pendingFunds = { total: 0, breakdown: {} };
    }
    
    const breakdown = portfolio.cs2.pendingFunds.breakdown;
    const totalUSD = portfolio.cs2.pendingFunds.total;
    const totalEUR = totalUSD / eurUsdRate;
    
    // Update totals
    totalPendingFundsUsd.textContent = `$${totalUSD.toFixed(2)}`;
    totalPendingFundsEur.textContent = `€${totalEUR.toFixed(2)}`;
    
    // Clear existing list
    pendingFundsList.innerHTML = '';
    
    if (Object.keys(breakdown).length === 0) {
        pendingFundsEmpty.classList.remove('hidden');
        return;
    }
    
    pendingFundsEmpty.classList.add('hidden');
    
    // Render each marketplace
    Object.entries(breakdown).forEach(([marketplace, amountUSD]) => {
        const amountEUR = amountUSD / eurUsdRate;
        
        const marketplaceElement = document.createElement('div');
        marketplaceElement.className = 'flex items-center justify-between p-3 glass-input rounded-lg';
        marketplaceElement.innerHTML = `
            <div class="flex-1">
                <div class="font-medium text-white">${marketplace}</div>
                <div class="text-sm text-gray-400">
                    $${amountUSD.toFixed(2)} (€${amountEUR.toFixed(2)})
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editPendingFunds('${marketplace}')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition duration-300">
                    Edit
                </button>
                <button onclick="removePendingFundsFromUI('${marketplace}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition duration-300">
                    Remove
                </button>
            </div>
        `;
        
        pendingFundsList.appendChild(marketplaceElement);
    });
}

function editPendingFunds(marketplace) {
    const amount = portfolio.cs2.pendingFunds.breakdown[marketplace];
    
    editingMarketplace = marketplace;
    document.getElementById('pending-funds-modal-title').textContent = 'Edit Marketplace Funds';
    document.getElementById('marketplace-name').value = marketplace;
    document.getElementById('funds-amount').value = amount;
    document.getElementById('pending-funds-modal').classList.remove('hidden');
}

// Global functions for onclick handlers
window.removePendingFundsFromUI = function(marketplace) {
    if (confirm(`Are you sure you want to remove ${marketplace}?`)) {
        removePendingFunds(marketplace);
        renderPendingFunds();
        updateCombinedDisplay();
        showNotification('Marketplace funds removed successfully!', 'success');
    }
};

window.editPendingFunds = editPendingFunds;

// Export fetchPricempireData for global access (used by shared.js fetchAllAssetPrices)
window.fetchPricempireData = fetchPricempireData;