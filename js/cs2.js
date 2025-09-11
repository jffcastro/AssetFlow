// CS2 page functionality with dynamic portfolio management

// Global DOM elements
let portfoliosContainer;
let totalCs2Usd;
let totalCs2Eur;

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addPortfolioBtn = document.getElementById('add-portfolio-btn');
    const addPortfolioModal = document.getElementById('add-portfolio-modal');
    const addPortfolioForm = document.getElementById('add-portfolio-form');
    const cancelAddPortfolio = document.getElementById('cancel-add-portfolio');
    
    // Initialize global DOM elements
    portfoliosContainer = document.getElementById('portfolios-container');
    totalCs2Usd = document.getElementById('total-cs2-usd');
    totalCs2Eur = document.getElementById('total-cs2-eur');
    
    // Event listeners
    addPortfolioBtn.addEventListener('click', () => showAddPortfolioModal());
    cancelAddPortfolio.addEventListener('click', () => hideAddPortfolioModal());
    addPortfolioForm.addEventListener('submit', handleAddPortfolio);
    
    // Initialize CS2 portfolios
    initializePortfolios();
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

function renderPortfolios() {
    portfoliosContainer.innerHTML = '';
    
    Object.entries(portfolio.cs2.portfolios).forEach(([id, portfolioData]) => {
        const portfolioElement = createPortfolioElement(id, portfolioData);
        portfoliosContainer.appendChild(portfolioElement);
    });
}

function createPortfolioElement(id, portfolioData) {
    const theme = colorThemes[portfolioData.color];
    const portfolioDiv = document.createElement('div');
    portfolioDiv.className = 'bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg';
    portfolioDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold ${theme.text}">${portfolioData.name}</h3>
            <div class="flex items-center gap-2">
                <div class="text-sm text-gray-400">${portfolioData.description}</div>
                <button onclick="removePortfolio('${id}')" class="text-red-400 hover:text-red-300 text-sm font-medium">
                    Remove
                </button>
            </div>
        </div>
        <div class="flex flex-col gap-4">
            <div>
                <label for="${id}-input" class="block text-sm font-medium mb-2">Value (USD)</label>
                <input type="number" id="${id}-input" step="any" placeholder="0.00" 
                       class="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:${theme.border} text-lg">
            </div>
            <div>
                <label for="${id}-realized-pnl-input" class="block text-sm font-medium mb-2">Realized P&L (USD)</label>
                <input type="number" id="${id}-realized-pnl-input" step="any" placeholder="0.00" 
                       class="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:${theme.border} text-lg">
            </div>
            <button onclick="savePortfolio('${id}')" 
                    class="${theme.bg} ${theme.hover} text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                Save ${portfolioData.name}
            </button>
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
    
    const totalUsd = Object.values(portfolio.cs2.portfolios)
        .reduce((sum, p) => sum + (p.value || 0), 0);
    
    // Update USD and EUR displays
    totalCs2Usd.textContent = formatCurrency(totalUsd, 'USD');
    const totalEur = totalUsd / eurUsdRate;
    totalCs2Eur.textContent = formatCurrency(totalEur, 'EUR');
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