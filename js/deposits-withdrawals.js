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
    
    // Initial render
    renderTransactionsList();
    renderDepositsSummary();
});

function openTransactionModal(mode = 'add', tx = null) {
    const transactionForm = document.getElementById('transaction-form');
    const transactionModalTitle = document.getElementById('transaction-modal-title');
    const transactionIdInput = document.getElementById('transaction-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionAssetTypeSelect = document.getElementById('transaction-asset-type');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionNoteInput = document.getElementById('transaction-note');
    
    transactionForm.reset();
    transactionModalTitle.textContent = mode === 'add' ? 'Add Transaction' : 'Edit Transaction';
    transactionIdInput.value = tx ? tx.id : '';
    
    if (tx) {
        transactionTypeSelect.value = tx.type;
        transactionAssetTypeSelect.value = tx.assetType;
        transactionAmountInput.value = tx.amount;
        transactionDateInput.value = tx.date;
        transactionNoteInput.value = tx.note || '';
    } else {
        transactionTypeSelect.value = 'deposit';
        transactionAssetTypeSelect.value = 'stocks';
        transactionAmountInput.value = '';
        transactionDateInput.value = new Date().toISOString().slice(0, 10);
        transactionNoteInput.value = '';
    }
    
    document.getElementById('transaction-modal').classList.remove('hidden');
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
}

function saveTransaction() {
    const transactionIdInput = document.getElementById('transaction-id');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionAssetTypeSelect = document.getElementById('transaction-asset-type');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionNoteInput = document.getElementById('transaction-note');
    
    const txData = {
        id: transactionIdInput.value ? parseInt(transactionIdInput.value) : Date.now(),
        type: transactionTypeSelect.value,
        assetType: transactionAssetTypeSelect.value,
        amount: parseFloat(transactionAmountInput.value),
        date: transactionDateInput.value,
        note: transactionNoteInput.value.trim()
    };
    
    let transactions = loadTransactions();
    
    if (transactionIdInput.value) {
        // Edit existing transaction
        transactions = transactions.map(tx => tx.id == transactionIdInput.value ? txData : tx);
    } else {
        // Add new transaction
        transactions.push(txData);
    }
    
    saveTransactions(transactions);
    renderDepositsSummary();
    renderTransactionsList();
    closeTransactionModal();
    showNotification('Transaction saved successfully!', 'success');
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        let transactions = loadTransactions().filter(t => t.id != id);
        saveTransactions(transactions);
        renderDepositsSummary();
        renderTransactionsList();
        showNotification('Transaction deleted successfully!', 'success');
    }
}

function renderTransactionsList() {
    const transactionsListDiv = document.getElementById('transactions-list');
    if (!transactionsListDiv) return;
    
    const transactions = loadTransactions();
    
    if (transactions.length === 0) {
        transactionsListDiv.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">No transactions logged.</td></tr>';
        return;
    }
    
    let html = '';
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactions.forEach(tx => {
        const typeColor = tx.type === 'deposit' ? 'text-green-400' : 'text-red-400';
        const typeIcon = tx.type === 'deposit' ? '↗' : '↘';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2">
                    <span class="${typeColor}">${typeIcon} ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                </td>
                <td class="py-2 px-2">${tx.assetType.charAt(0).toUpperCase() + tx.assetType.slice(1)}</td>
                <td class="py-2 px-2 font-semibold">${formatCurrency(tx.amount, 'EUR')}</td>
                <td class="py-2 px-2">${tx.date}</td>
                <td class="py-2 px-2">${tx.note || '-'}</td>
                <td class="py-2 px-2">
                    <button onclick="editTransaction(${tx.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</button>
                    <button onclick="deleteTransaction(${tx.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                </td>
            </tr>
        `;
    });
    
    transactionsListDiv.innerHTML = html;
}

function renderDepositsSummary() {
    const depositsSummaryTable = document.getElementById('deposits-summary-table');
    if (!depositsSummaryTable) return;
    
    const transactions = loadTransactions();
    const totals = getTransactionTotals(transactions);
    
    const assetLabels = {
        stocks: 'Stocks',
        etfs: 'ETFs',
        crypto: 'Crypto',
        cs2: 'CS2'
    };
    
    let html = '';
    Object.keys(assetLabels).forEach(type => {
        // Ensure totals[type] exists, otherwise use default values
        const typeTotals = totals[type] || { deposit: 0, withdrawal: 0 };
        const dep = typeTotals.deposit || 0;
        const wit = typeTotals.withdrawal || 0;
        const net = dep - wit;
        const netClass = net >= 0 ? 'text-green-400' : 'text-red-400';
        
        html += `
            <tr class="border-b border-gray-700">
                <td class="py-2 px-2 font-semibold">${assetLabels[type]}</td>
                <td class="py-2 px-2 text-green-300">${formatCurrency(dep, 'EUR')}</td>
                <td class="py-2 px-2 text-red-300">${formatCurrency(wit, 'EUR')}</td>
                <td class="py-2 px-2 ${netClass} font-bold">${formatCurrency(net, 'EUR')}</td>
            </tr>
        `;
    });
    
    // Add total row
    const totalDeposits = Object.values(totals).reduce((sum, t) => sum + t.deposit, 0);
    const totalWithdrawals = Object.values(totals).reduce((sum, t) => sum + t.withdrawal, 0);
    const totalNet = totalDeposits - totalWithdrawals;
    const totalNetClass = totalNet >= 0 ? 'text-green-400' : 'text-red-400';
    
    html += `
        <tr class="border-t-2 border-emerald-500 bg-gray-900">
            <td class="py-2 px-2 font-bold text-emerald-300">Total</td>
            <td class="py-2 px-2 font-bold text-green-300">${formatCurrency(totalDeposits, 'EUR')}</td>
            <td class="py-2 px-2 font-bold text-red-300">${formatCurrency(totalWithdrawals, 'EUR')}</td>
            <td class="py-2 px-2 font-bold ${totalNetClass}">${formatCurrency(totalNet, 'EUR')}</td>
        </tr>
    `;
    
    depositsSummaryTable.innerHTML = html;
}

function editTransaction(id) {
    const transactions = loadTransactions();
    const tx = transactions.find(t => t.id == id);
    if (tx) {
        openTransactionModal('edit', tx);
    }
}
