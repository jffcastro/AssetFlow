// Cash & Savings page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addStaticBtn = document.getElementById('add-static-btn');
    const staticModal = document.getElementById('static-modal');
    const staticForm = document.getElementById('static-form');
    const staticCancelBtn = document.getElementById('static-cancel-btn');
    const staticModalTitle = document.getElementById('static-modal-title');
    
    const staticIdInput = document.getElementById('static-id');
    const staticTypeSelect = document.getElementById('static-type');
    const staticNameInput = document.getElementById('static-name');
    const staticValueInput = document.getElementById('static-value');
    const staticCurrencySelect = document.getElementById('static-currency');
    const staticYieldAccountCheckbox = document.getElementById('static-yield-account');
    const staticInterestRateInput = document.getElementById('static-interest-rate');
    const yieldRateContainer = document.getElementById('yield-rate-container');
    
    // Event listeners
    addStaticBtn.addEventListener('click', () => openStaticModal('add'));
    staticCancelBtn.addEventListener('click', closeStaticModal);
    staticModal.addEventListener('click', (e) => {
        if (e.target === staticModal) closeStaticModal();
    });
    
    staticForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveStaticAsset();
    });
    
    // Yield account checkbox event listener
    staticYieldAccountCheckbox.addEventListener('change', (e) => {
        yieldRateContainer.style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Event delegation for edit and delete buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-static-btn')) {
            const assetId = parseInt(e.target.dataset.assetId);
            editStaticAsset(assetId);
        } else if (e.target.classList.contains('delete-static-btn')) {
            const assetId = parseInt(e.target.dataset.assetId);
            deleteStaticAsset(assetId);
        }
    });

    // Initial render
    renderStaticAssets();
});

function openStaticModal(mode = 'add', asset = null) {
    const staticForm = document.getElementById('static-form');
    const staticModalTitle = document.getElementById('static-modal-title');
    const staticIdInput = document.getElementById('static-id');
    const staticTypeSelect = document.getElementById('static-type');
    const staticNameInput = document.getElementById('static-name');
    const staticValueInput = document.getElementById('static-value');
    const staticCurrencySelect = document.getElementById('static-currency');
    const staticYieldAccountCheckbox = document.getElementById('static-yield-account');
    const staticInterestRateInput = document.getElementById('static-interest-rate');
    const yieldRateContainer = document.getElementById('yield-rate-container');
    
    staticForm.reset();
    staticModalTitle.textContent = mode === 'add' ? 'Add New Account' : 'Edit Account';
    staticIdInput.value = asset ? asset.id : '';
    
    if (asset) {
        staticTypeSelect.value = asset.type;
        staticNameInput.value = asset.name;
        staticYieldAccountCheckbox.checked = asset.isYieldAccount || false;
        staticInterestRateInput.value = asset.interestRate || '';
        yieldRateContainer.style.display = staticYieldAccountCheckbox.checked ? 'block' : 'none';
        
        if (asset.values && asset.values.length > 0) {
            const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            staticValueInput.value = latest.value;
            staticCurrencySelect.value = latest.currency || 'EUR';
        }
    } else {
        staticTypeSelect.value = 'Savings';
        staticCurrencySelect.value = 'EUR';
        staticYieldAccountCheckbox.checked = false;
        yieldRateContainer.style.display = 'none';
    }
    
    document.getElementById('static-modal').classList.remove('hidden');
}

function closeStaticModal() {
    document.getElementById('static-modal').classList.add('hidden');
}

function saveStaticAsset() {
    const staticIdInput = document.getElementById('static-id');
    const staticTypeSelect = document.getElementById('static-type');
    const staticNameInput = document.getElementById('static-name');
    const staticValueInput = document.getElementById('static-value');
    const staticCurrencySelect = document.getElementById('static-currency');
    const staticYieldAccountCheckbox = document.getElementById('static-yield-account');
    const staticInterestRateInput = document.getElementById('static-interest-rate');
    
    const assetData = {
        id: staticIdInput.value ? parseInt(staticIdInput.value) : Date.now(),
        type: staticTypeSelect.value,
        name: staticNameInput.value,
        isYieldAccount: staticYieldAccountCheckbox.checked,
        interestRate: staticYieldAccountCheckbox.checked ? parseFloat(staticInterestRateInput.value) || 0 : 0,
        values: [{
            date: new Date().toISOString().slice(0, 10),
            value: parseFloat(staticValueInput.value),
            currency: staticCurrencySelect.value
        }]
    };
    
    if (staticIdInput.value) {
        // Edit existing asset - preserve history
        const index = portfolio.static.findIndex(a => a.id == staticIdInput.value);
        if (index !== -1) {
            const existingAsset = portfolio.static[index];
            assetData.values = [...existingAsset.values, assetData.values[0]];
            portfolio.static[index] = assetData;
        }
    } else {
        // Add new asset
        portfolio.static.push(assetData);
    }
    
    saveData();
    renderStaticAssets();
    closeStaticModal();
    showNotification('Static asset saved successfully!', 'success');
}

function deleteStaticAsset(id) {
    if (confirm('Are you sure you want to delete this static asset?')) {
        portfolio.static = portfolio.static.filter(a => a.id != id);
        saveData();
        renderStaticAssets();
        showNotification('Static asset deleted successfully!', 'success');
    }
}


function renderStaticAssets() {
    renderStaticAssetsByType('Savings', 'savings-tbody', 'savings-count');
    renderStaticAssetsByType('Emergency Fund', 'emergency-tbody', 'emergency-count');
    renderStaticAssetsByType('Cash', 'cash-tbody', 'cash-count');
}

function renderStaticAssetsByType(type, tbodyId, countId) {
    const tbody = document.getElementById(tbodyId);
    const countElement = document.getElementById(countId);
    if (!tbody) return;
    
    const assetsOfType = portfolio.static.filter(asset => asset.type === type);
    
    // Update count
    if (countElement) {
        countElement.textContent = assetsOfType.length;
    }
    
    if (assetsOfType.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">No assets of this type added yet.</td></tr>';
        return;
    }
    
    let html = '';
    let totalValue = 0;
    
    assetsOfType.forEach(asset => {
        let currentValue = 0;
        let currency = 'EUR';
        let lastUpdated = 'Never';
        
        if (asset.values && asset.values.length > 0) {
            const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            currentValue = latest.value;
            currency = latest.currency || 'EUR';
            lastUpdated = latest.date;
        }
        
        // Convert to EUR for total calculation
        let valueEur = currentValue;
        if (currency === 'USD') {
            valueEur = currentValue / eurUsdRate;
        }
        totalValue += valueEur;
        
        // Calculate projected value for yield accounts
        let projectedValue = '--';
        if (asset.isYieldAccount && asset.interestRate > 0) {
            const projectedAmount = currentValue * (1 + asset.interestRate / 100);
            projectedValue = formatCurrency(projectedAmount, currency);
        }
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 font-semibold">${asset.name}</td>
                <td class="py-2 px-2">${formatCurrency(currentValue, currency)}</td>
                <td class="py-2 px-2 ${asset.isYieldAccount ? 'text-emerald-400' : 'text-gray-400'}">${projectedValue}</td>
                <td class="py-2 px-2">${currency}</td>
                <td class="py-2 px-2">${lastUpdated}</td>
                <td class="py-2 px-2">
                    <button data-asset-id="${asset.id}" class="edit-static-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</button>
                    <button data-asset-id="${asset.id}" class="delete-static-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Add total row
    if (assetsOfType.length > 0) {
        html += `
            <tr class="border-t-2 border-emerald-500 bg-gray-900">
                <td colspan="1" class="py-2 px-2 font-bold text-emerald-300">Total</td>
                <td class="py-2 px-2 font-bold text-emerald-300">${formatCurrency(totalValue, 'EUR')}</td>
                <td colspan="4" class="py-2 px-2"></td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

function editStaticAsset(id) {
    const asset = portfolio.static.find(a => a.id == id);
    if (asset) {
        openStaticModal('edit', asset);
    }
}

