// Transactions page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transactionCancelBtn = document.getElementById('transaction-cancel-btn');
    const transactionModalTitle = document.getElementById('transaction-modal-title');
    
    const transactionIdInput = document.getElementById('transaction-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionAssetTypeSelect = document.getElementById('transaction-asset-type');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionNoteInput = document.getElementById('transaction-note');
    const transactionsListDiv = document.getElementById('transactions-list');
    
    // Event listeners
    addTransactionBtn.addEventListener('click', () => openTransactionModal('add'));
    transactionCancelBtn.addEventListener('click', closeTransactionModal);
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) closeTransactionModal();
    });
    
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });
    
    // Set default date to today
    transactionDateInput.value = new Date().toISOString().slice(0, 10);
    
    // Filter controls
    const accountFilter = document.getElementById('account-filter');
    const noteSearch = document.getElementById('note-search');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    if (accountFilter) {
        accountFilter.addEventListener('input', renderTransactionsList);
    }
    
    if (noteSearch) {
        noteSearch.addEventListener('input', renderTransactionsList);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (accountFilter) accountFilter.value = '';
            if (noteSearch) noteSearch.value = '';
            renderTransactionsList();
        });
    }
    
    // New controls
    const hideLowValueCheckbox = document.getElementById('hide-low-value');
    const valueThresholdInput = document.getElementById('value-threshold');
    const showAllTransactionsCheckbox = document.getElementById('show-all-transactions');
    if (hideLowValueCheckbox) {
        hideLowValueCheckbox.addEventListener('change', renderDepositsSummary);
    }
    
    if (valueThresholdInput) {
        valueThresholdInput.addEventListener('input', renderDepositsSummary);
    }
    
    if (showAllTransactionsCheckbox) {
        showAllTransactionsCheckbox.addEventListener('change', renderTransactionsList);
    }
    
    // Initial render
    renderTransactionsList();
    renderDepositsSummary();
});

function openTransactionModal(mode = 'add', tx = null) {
    const transactionForm = document.getElementById('transaction-form');
    const transactionModalTitle = document.getElementById('transaction-modal-title');
    const transactionIdInput = document.getElementById('transaction-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionAccountInput = document.getElementById('transaction-account');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionNoteInput = document.getElementById('transaction-note');
    
    transactionForm.reset();
    transactionModalTitle.textContent = mode === 'add' ? 'Add Transaction' : 'Edit Transaction';
    transactionIdInput.value = tx ? tx.id : '';
    
    if (tx) {
        transactionTypeSelect.value = tx.type;
        transactionAccountInput.value = tx.account || '';
        transactionAmountInput.value = tx.amount;
        transactionDateInput.value = tx.date;
        transactionNoteInput.value = tx.note || '';
    } else {
        transactionTypeSelect.value = 'deposit';
        transactionAccountInput.value = '';
        transactionAmountInput.value = '';
        transactionDateInput.value = new Date().toISOString().slice(0, 10);
        transactionNoteInput.value = '';
    }
    
    document.getElementById('transaction-modal').classList.remove('hidden');
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
}

// Deposit/withdrawal functions are now in shared.js

function saveTransaction() {
    const transactionIdInput = document.getElementById('transaction-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionAccountInput = document.getElementById('transaction-account');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionNoteInput = document.getElementById('transaction-note');
    
    const txData = {
        id: transactionIdInput.value ? parseInt(transactionIdInput.value) : Date.now(),
        type: transactionTypeSelect.value,
        account: transactionAccountInput.value.trim(),
        amount: parseFloat(transactionAmountInput.value),
        date: transactionDateInput.value,
        note: transactionNoteInput.value.trim()
    };
    
    let transactions = loadDepositTransactions();
    
    if (transactionIdInput.value) {
        // Edit existing transaction
        transactions = transactions.map(tx => tx.id == transactionIdInput.value ? txData : tx);
    } else {
        // Add new transaction
        transactions.push(txData);
    }
    
    saveDepositTransactions(transactions);
    renderDepositsSummary();
    renderTransactionsList();
    closeTransactionModal();
    showNotification('Transaction saved successfully!', 'success');
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        let transactions = loadDepositTransactions().filter(t => t.id != id);
        saveDepositTransactions(transactions);
        renderDepositsSummary();
        renderTransactionsList();
        showNotification('Transaction deleted successfully!', 'success');
    }
}

function renderTransactionsList() {
    const transactionsListDiv = document.getElementById('transactions-list');
    const transactionsCountSpan = document.getElementById('transactions-count');
    if (!transactionsListDiv) return;
    
    // Get deposit/withdrawal transactions from separate storage
    const transactions = loadDepositTransactions();
    
    // Apply filters
    const filteredTransactions = applyFilters(transactions);
    
    // Sort transactions by date (latest first) before limiting
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Check if we should limit to 10 transactions
    const showAllTransactionsCheckbox = document.getElementById('show-all-transactions');
    const showAll = showAllTransactionsCheckbox ? showAllTransactionsCheckbox.checked : false;
    
    let displayTransactions = filteredTransactions;
    if (!showAll) {
        displayTransactions = filteredTransactions.slice(0, 10);
    }
    
    // Update count
    if (transactionsCountSpan) {
        const totalCount = filteredTransactions.length;
        const displayCount = displayTransactions.length;
        if (showAll || totalCount <= 10) {
            transactionsCountSpan.textContent = totalCount;
        } else {
            transactionsCountSpan.textContent = `${displayCount} of ${totalCount}`;
        }
    }
    
    if (displayTransactions.length === 0) {
        transactionsListDiv.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">No deposit/withdrawal transactions found.</td></tr>';
        return;
    }
    
    let html = '';
    
    displayTransactions.forEach(tx => {
        const typeColor = tx.type === 'deposit' ? 'text-green-400' : 'text-red-400';
        const typeIcon = tx.type === 'deposit' ? '↗' : '↘';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2">
                    <span class="${typeColor}">${typeIcon} ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                </td>
                <td class="py-2 px-2">${tx.account || 'Unknown Account'}</td>
                <td class="py-2 px-2 font-semibold">${formatCurrency(tx.amount, 'EUR')}</td>
                <td class="py-2 px-2">${tx.date}</td>
                <td class="py-2 px-2">${tx.note || '-'}</td>
                <td class="py-2 px-2">
                    <button onclick="editTransaction(${tx.id})" class="glass-button text-xs px-2 py-1 mr-1">✏️</button>
                    <button onclick="deleteTransaction(${tx.id})" class="glass-button glass-button-danger text-xs px-2 py-1">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    transactionsListDiv.innerHTML = html;
}

function applyFilters(transactions) {
    const accountFilter = document.getElementById('account-filter')?.value || '';
    const noteSearch = document.getElementById('note-search')?.value || '';
    
    return transactions.filter(tx => {
        // Filter by account
        if (accountFilter && (!tx.account || !tx.account.toLowerCase().includes(accountFilter.toLowerCase()))) {
            return false;
        }
        
        // Filter by note search
        if (noteSearch && (!tx.note || !tx.note.toLowerCase().includes(noteSearch.toLowerCase()))) {
            return false;
        }
        
        return true;
    });
}

function getAccountTotals(transactions) {
    const totals = {};
    transactions.forEach(tx => {
        const account = tx.account || 'Unknown Account';
        if (!totals[account]) {
            totals[account] = { deposit: 0, withdrawal: 0 };
        }
        if (tx.type === 'deposit') totals[account].deposit += tx.amount;
        if (tx.type === 'withdrawal') totals[account].withdrawal += tx.amount;
    });
    return totals;
}

function renderDepositsSummary() {
    const depositsSummaryTable = document.getElementById('deposits-summary-table');
    if (!depositsSummaryTable) return;

    // Get deposit/withdrawal transactions from separate storage
    const transactions = loadDepositTransactions();
    const totals = getAccountTotals(transactions);

    // Get filter settings
    const hideLowValueCheckbox = document.getElementById('hide-low-value');
    const valueThresholdInput = document.getElementById('value-threshold');
    const hideLowValue = hideLowValueCheckbox ? hideLowValueCheckbox.checked : false;
    const threshold = valueThresholdInput ? parseFloat(valueThresholdInput.value) || 50 : 50;

    // Load account labels from localStorage
    let accountLabels = {};
    try {
        accountLabels = JSON.parse(localStorage.getItem('portfolioPilotAccountLabels') || '{}');
    } catch (e) { accountLabels = {}; }

    // UI for assigning labels (shown next to each account row)
    function labelInput(account) {
        const label = accountLabels[account] || '';
        return `<input type="text" class="glass-input p-1 rounded w-24 text-xs" value="${label}" data-account="${account}" onchange="window.setAccountLabel(this)">`;
    }

    // Group accounts by label
    const groups = {};
    Object.keys(totals).forEach(account => {
        // Filter out low-value accounts if enabled
        const dep = totals[account].deposit || 0;
        const wit = totals[account].withdrawal || 0;
        const net = Math.abs(dep - wit);
        if (hideLowValue && net < threshold) return;
        const label = accountLabels[account] || 'Ungrouped';
        if (!groups[label]) groups[label] = [];
        groups[label].push({ account, dep, wit, net });
    });

    let html = '';
    Object.keys(groups).forEach(label => {
        // Group totals
        const groupAccounts = groups[label];
        const groupDep = groupAccounts.reduce((sum, a) => sum + a.dep, 0);
        const groupWit = groupAccounts.reduce((sum, a) => sum + a.wit, 0);
        const groupNet = groupWit - groupDep;
        // Green for withdrawals (money in), red for deposits (money out)
        const groupNetClass = groupNet >= 0 ? 'text-green-400' : 'text-red-400';
    
    let html = '';
    let filteredAccounts = Object.keys(totals).sort();
    
    // Filter out low-value accounts if enabled
    if (hideLowValue) {
        filteredAccounts = filteredAccounts.filter(account => {
            const accountTotals = totals[account];
            const dep = accountTotals.deposit || 0;
            const wit = accountTotals.withdrawal || 0;
            const net = Math.abs(dep - wit);
            return net >= threshold;
        });
    }
    
    // Render accounts
    filteredAccounts.forEach(account => {
        const accountTotals = totals[account];
        const dep = accountTotals.deposit || 0;
        const wit = accountTotals.withdrawal || 0;
        const net = dep - wit;
        const netClass = net >= 0 ? 'text-red-400' : 'text-green-400';
        
        html += `
            <tr class="border-b-2 border-emerald-500 bg-gray-800">
                <td colspan="4" class="py-2 px-2 font-bold text-emerald-300">${label} (${groupAccounts.length} account${groupAccounts.length > 1 ? 's' : ''})</td>
            </tr>
            <tr class="border-b border-gray-700">

                <td class="py-2 px-2 font-semibold">Group Total</td>
                <td class="py-2 px-2 text-red-300">${formatCurrency(groupDep, 'EUR')}</td>
                <td class="py-2 px-2 text-green-300">${formatCurrency(groupWit, 'EUR')}</td>
                <td class="py-2 px-2 ${groupNetClass} font-bold">${formatCurrency(groupNet, 'EUR')}</td>
                <td class="py-2 px-2 font-semibold">${account}</td>
                <td class="py-2 px-2 text-red-300">${formatCurrency(dep, 'EUR')}</td>
                <td class="py-2 px-2 text-green-300">${formatCurrency(wit, 'EUR')}</td>
                <td class="py-2 px-2 ${netClass} font-bold">${formatCurrency(net, 'EUR')}</td>
            </tr>
        `;
        // Individual accounts in group
        groupAccounts.forEach(a => {
            const net = a.wit - a.dep;
            const netClass = net >= 0 ? 'text-green-400' : 'text-red-400';
            html += `
                <tr class="border-b border-gray-700">
                    <td class="py-2 px-2 font-semibold">${a.account} ${labelInput(a.account)}</td>
                    <td class="py-2 px-2 text-red-300">${formatCurrency(a.dep, 'EUR')}</td>
                    <td class="py-2 px-2 text-green-300">${formatCurrency(a.wit, 'EUR')}</td>
                    <td class="py-2 px-2 ${netClass} font-bold">${formatCurrency(net, 'EUR')}</td>
                </tr>
            `;
        });
    });

    // Add total row
    const totalDeposits = Object.values(totals).reduce((sum, t) => sum + t.deposit, 0);
    const totalWithdrawals = Object.values(totals).reduce((sum, t) => sum + t.withdrawal, 0);
    const totalNet = totalWithdrawals - totalDeposits;
    const totalNetClass = totalNet >= 0 ? 'text-green-400' : 'text-red-400';

    const totalNet = totalDeposits - totalWithdrawals;
    const totalNetClass = totalNet >= 0 ? 'text-red-400' : 'text-green-400';
    
    html += `
        <tr class="border-t-2 border-emerald-500 bg-gray-900">
            <td class="py-2 px-2 font-bold text-emerald-300">Total</td>
            <td class="py-2 px-2 font-bold text-red-300">${formatCurrency(totalDeposits, 'EUR')}</td>
            <td class="py-2 px-2 font-bold text-green-300">${formatCurrency(totalWithdrawals, 'EUR')}</td>
            <td class="py-2 px-2 font-bold ${totalNetClass}">${formatCurrency(totalNet, 'EUR')}</td>
        </tr>
    `;

    depositsSummaryTable.innerHTML = html;
// Global function to set account label from input
window.setAccountLabel = function(input) {
    const account = input.getAttribute('data-account');
    const value = input.value.trim();
    let accountLabels = {};
    try {
        accountLabels = JSON.parse(localStorage.getItem('portfolioPilotAccountLabels') || '{}');
    } catch (e) { accountLabels = {}; }
    if (value) {
        accountLabels[account] = value;
    } else {
        delete accountLabels[account];
    }
    localStorage.setItem('portfolioPilotAccountLabels', JSON.stringify(accountLabels));
    renderDepositsSummary();
};
}

function editTransaction(id) {
    const transactions = loadDepositTransactions();
    const tx = transactions.find(t => t.id == id);
    if (tx) {
        openTransactionModal('edit', tx);
    }
}

// Debug function to verify separation (can be called from browser console)
function debugDepositSeparation() {
    const buySellTransactions = loadTransactions();
    const depositTransactions = loadDepositTransactions();
    
    console.log('=== DEPOSIT/WITHDRAWAL SEPARATION DEBUG ===');
    console.log('Buy/Sell transactions (portfolioPilotTransactions):', buySellTransactions.length);
    console.log('Deposit/Withdrawal transactions (portfolioPilotDeposits):', depositTransactions.length);
    
    const buySellTypes = buySellTransactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
    }, {});
    
    const depositTypes = depositTransactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
    }, {});
    
    console.log('Buy/Sell transaction types:', buySellTypes);
    console.log('Deposit/Withdrawal transaction types:', depositTypes);
    
    // Check for any cross-contamination
    const buySellDeposits = buySellTransactions.filter(tx => tx.type === 'deposit' || tx.type === 'withdrawal');
    const depositBuySells = depositTransactions.filter(tx => tx.type === 'buy' || tx.type === 'sell');
    
    if (buySellDeposits.length > 0) {
        console.warn('⚠️ Found deposit/withdrawal transactions in buy/sell storage:', buySellDeposits);
    }
    
    if (depositBuySells.length > 0) {
        console.warn('⚠️ Found buy/sell transactions in deposit storage:', depositBuySells);
    }
    
    if (buySellDeposits.length === 0 && depositBuySells.length === 0) {
        console.log('✅ Separation is working correctly!');
    }
    
    return {
        buySellCount: buySellTransactions.length,
        depositCount: depositTransactions.length,
        buySellTypes,
        depositTypes,
        separationWorking: buySellDeposits.length === 0 && depositBuySells.length === 0
    };
}

// Make debug function available globally
window.debugDepositSeparation = debugDepositSeparation;

// Deposit transaction functions are now available globally from shared.js
