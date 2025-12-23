// Combined API Keys and Database configuration functionality
document.addEventListener('DOMContentLoaded', () => {
    // API Keys DOM elements
    const fhApiKeyInput = document.getElementById('fh-api-key');
    const fhStatus = document.getElementById('fh-status');
    const saveFhBtn = document.getElementById('save-fh-btn');
    const fhUsage = document.getElementById('fh-usage');
    
    const cmcApiKeyInput = document.getElementById('cmc-api-key');
    const cmcStatus = document.getElementById('cmc-status');
    const saveCmcBtn = document.getElementById('save-cmc-btn');
    const cmcUsage = document.getElementById('cmc-usage');
    
    const peApiKeyInput = document.getElementById('pe-api-key');
    const peStatus = document.getElementById('pe-status');
    const savePeBtn = document.getElementById('save-pe-btn');
    const peUsage = document.getElementById('pe-usage');
    
    // Notes elements
    const configNotesTextarea = document.getElementById('config-notes');
    const charCount = document.getElementById('notes-char-count');

    // Initialize page
    loadApiKeys();
    updateApiStatuses();
    loadUsageStats();
    initializeNotes();

    // API Keys Event listeners
    saveFhBtn.addEventListener('click', saveFinnhubKey);
    saveCmcBtn.addEventListener('click', saveCoinMarketCalKey);
    savePeBtn.addEventListener('click', savePricEmpireKey);

    
    // Selective export button
    const selectiveExportBtn = document.getElementById('selective-export-btn');
    if (selectiveExportBtn) {
        selectiveExportBtn.addEventListener('click', exportSelectiveData);
    }

    // ==================== API KEYS FUNCTIONS ====================

    // Finnhub API functions
    function saveFinnhubKey() {
        const apiKey = fhApiKeyInput.value.trim();
        
        if (!apiKey) {
            showNotification('Please enter your Finnhub API key', 'error');
            return;
        }
        
        const fhConfig = {
            apiKey: apiKey,
            savedAt: new Date().toISOString()
        };
        
        setEncryptedItem('portfolioPilotFinnhub', JSON.stringify(fhConfig));
        showNotification('Finnhub API key saved successfully!', 'success');
        updateApiStatuses();
    }

    function loadFinnhubKey() {
        const config = getEncryptedItem('portfolioPilotFinnhub');
        if (config) {
            const parsed = JSON.parse(config);
            fhApiKeyInput.value = parsed.apiKey || '';
            return parsed;
        }
        return null;
    }

    // CoinMarketCal API functions
    function saveCoinMarketCalKey() {
        const apiKey = cmcApiKeyInput.value.trim();
        
        if (!apiKey) {
            showNotification('Please enter your CoinMarketCal API key', 'error');
            return;
        }
        
        const cmcConfig = {
            apiKey: apiKey,
            savedAt: new Date().toISOString()
        };
        
        setEncryptedItem('portfolioPilotCoinMarketCal', JSON.stringify(cmcConfig));
        showNotification('CoinMarketCal API key saved successfully!', 'success');
        updateApiStatuses();
    }

    function loadCoinMarketCalKey() {
        const config = getEncryptedItem('portfolioPilotCoinMarketCal');
        if (config) {
            const parsed = JSON.parse(config);
            cmcApiKeyInput.value = parsed.apiKey || '';
            return parsed;
        }
        return null;
    }

    // Pricempire API functions
    function savePricEmpireKey() {
        const apiKey = peApiKeyInput.value.trim();
        
        if (!apiKey) {
            showNotification('Please enter your Pricempire API key', 'error');
            return;
        }
        
        const peConfig = {
            apiKey: apiKey,
            savedAt: new Date().toISOString()
        };
        
        setEncryptedItem('portfolioPilotPricEmpire', JSON.stringify(peConfig));
        showNotification('Pricempire API key saved successfully!', 'success');
        updateApiStatuses();
    }

    function loadPricEmpireKey() {
        const config = getEncryptedItem('portfolioPilotPricEmpire');
        if (config) {
            const parsed = JSON.parse(config);
            peApiKeyInput.value = parsed.apiKey || '';
            return parsed;
        }
        return null;
    }

    // Load all API keys
    function loadApiKeys() {
        loadFinnhubKey();
        loadCoinMarketCalKey();
        loadPricEmpireKey();
    }

    // Update API status indicators
    function updateApiStatuses() {
        const fhConfig = getEncryptedItem('portfolioPilotFinnhub');
        const cmcConfig = getEncryptedItem('portfolioPilotCoinMarketCal');
        const peConfig = getEncryptedItem('portfolioPilotPricEmpire');
        
        // Finnhub status
        if (fhConfig) {
            const parsed = JSON.parse(fhConfig);
            if (parsed.apiKey) {
                fhStatus.textContent = 'Configured';
                fhStatus.className = 'text-xs px-2 py-1 rounded-full bg-green-700 text-green-100';
            } else {
                fhStatus.textContent = 'Incomplete';
                fhStatus.className = 'text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-100';
            }
        } else {
            fhStatus.textContent = 'Not Configured';
            fhStatus.className = 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300';
        }
        
        // CoinMarketCal status
        if (cmcConfig) {
            const parsed = JSON.parse(cmcConfig);
            if (parsed.apiKey) {
                cmcStatus.textContent = 'Configured';
                cmcStatus.className = 'text-xs px-2 py-1 rounded-full bg-green-700 text-green-100';
            } else {
                cmcStatus.textContent = 'Incomplete';
                cmcStatus.className = 'text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-100';
            }
        } else {
            cmcStatus.textContent = 'Not Configured';
            cmcStatus.className = 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300';
        }
        
        // Pricempire status
        if (peConfig) {
            const parsed = JSON.parse(peConfig);
            if (parsed.apiKey) {
                peStatus.textContent = 'Configured';
                peStatus.className = 'text-xs px-2 py-1 rounded-full bg-green-700 text-green-100';
            } else {
                peStatus.textContent = 'Incomplete';
                peStatus.className = 'text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-100';
            }
        } else {
            peStatus.textContent = 'Not Configured';
            peStatus.className = 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300';
        }
    }

    // Usage statistics functions
    function loadUsageStats() {
        const today = new Date().toDateString();
        const fhUsageData = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
        const cmcUsageData = JSON.parse(localStorage.getItem('portfolioPilotCoinMarketCalUsage') || '{}');
        const peUsageData = JSON.parse(localStorage.getItem('portfolioPilotPricEmpireUsage') || '{}');
        
        fhUsage.textContent = `${fhUsageData[today] || 0} calls today`;
        cmcUsage.textContent = `${cmcUsageData[today] || 0} calls today`;
        peUsage.textContent = `${peUsageData[today] || 0} calls today`;
    }



    // ==================== NOTES FUNCTIONS ====================

    function initializeNotes() {
        if (configNotesTextarea && charCount) {
            // Load existing notes
            loadNotes();
            
            // Event listeners
            configNotesTextarea.addEventListener('input', () => {
                updateCharCount();
                autoSaveNotes();
            });
            
            // Auto-save on blur
            configNotesTextarea.addEventListener('blur', autoSaveNotes);
        }
    }

    function loadNotes() {
        if (configNotesTextarea && charCount) {
            const notes = localStorage.getItem('configNotes') || '';
            configNotesTextarea.value = notes;
            updateCharCount();
        }
    }

    function autoSaveNotes() {
        if (configNotesTextarea) {
            const notes = configNotesTextarea.value;
            localStorage.setItem('configNotes', notes);
        }
    }

    function updateCharCount() {
        if (configNotesTextarea && charCount) {
            const count = configNotesTextarea.value.length;
            charCount.textContent = count;
        }
    }

    // ==================== HELPER FUNCTIONS ====================


    // Track API usage (called from other parts of the app)
    function trackApiUsage(apiName) {
        const today = new Date().toDateString();
        const storageKey = `portfolioPilot${apiName}Usage`;
        const usageData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        usageData[today] = (usageData[today] || 0) + 1;
        localStorage.setItem(storageKey, JSON.stringify(usageData));
    }

    // Get API key for use in other parts of the app
    function getApiKey(apiName) {
        const config = getEncryptedItem(`portfolioPilot${apiName}`);
        if (config) {
            const parsed = JSON.parse(config);
            return parsed.apiKey;
        }
        return null;
    }

    // Migration Tools
    const migrateTransactionsBtn = document.getElementById('migrate-transactions-btn');
    const migrationStatusText = document.getElementById('migration-status-text');
    const migrateBtnText = document.getElementById('migrate-btn-text');
    
    function updateMigrationStatus() {
        const status = getMigrationStatus();
        
        if (status.needsMigration) {
            migrationStatusText.textContent = `${status.unmigratedUSDTransactions} USD transactions need migration (${status.totalUSDTransactions} total USD transactions)`;
            migrateTransactionsBtn.disabled = false;
            migrateBtnText.textContent = `Migrate ${status.unmigratedUSDTransactions} Transactions`;
        } else {
            migrationStatusText.textContent = `All USD transactions are up to date (${status.totalUSDTransactions} total USD transactions)`;
            migrateTransactionsBtn.disabled = true;
            migrateBtnText.textContent = 'No Migration Needed';
        }
    }
    
    migrateTransactionsBtn.addEventListener('click', async () => {
        migrateTransactionsBtn.disabled = true;
        migrateBtnText.textContent = 'Migrating...';
        migrationStatusText.textContent = 'Starting migration...';
        
        try {
            const result = await migrateExistingUSDTransactions();
            
            if (result.migrated > 0) {
                migrationStatusText.textContent = `Migration completed: ${result.migrated} transactions migrated successfully`;
                if (result.errors > 0) {
                    migrationStatusText.textContent += `, ${result.errors} errors occurred`;
                }
                showNotification(`Successfully migrated ${result.migrated} transactions!`, 'success');
            } else {
                migrationStatusText.textContent = 'No transactions needed migration';
                showNotification('No transactions needed migration', 'info');
            }
            
            // Update status after migration
            setTimeout(updateMigrationStatus, 1000);
            
        } catch (error) {
            console.error('Migration error:', error);
            migrationStatusText.textContent = 'Migration failed. Check console for details.';
            showNotification('Migration failed. Please try again.', 'error');
        } finally {
            migrateTransactionsBtn.disabled = false;
            migrateBtnText.textContent = 'Migrate USD Transactions';
        }
    });
    
    // Initialize migration status
    updateMigrationStatus();


    // ==================== SELECTIVE EXPORT FUNCTIONS ====================

    // Selective export function that only backs up specific data types
    function exportSelectiveData() {
        try {
            // Get all transactions and filter by asset type
            const allTransactions = JSON.parse(localStorage.getItem('portfolioPilotTransactions') || '[]');
            const selectedTransactions = allTransactions.filter(tx => 
                tx.assetType === 'stocks' || tx.assetType === 'etfs' || tx.assetType === 'crypto'
            );
            
            // Get portfolio data and extract only static assets and CS2
            const portfolioData = JSON.parse(localStorage.getItem('portfolioPilotData') || '{}');
            const selectivePortfolio = {
                static: portfolioData.static || [],
                cs2: portfolioData.cs2 || {}
            };
            
            // Get deposits and withdrawals
            const depositsAndWithdrawals = JSON.parse(localStorage.getItem('portfolioPilotDeposits') || '[]');
            
            // Create backup in the same format as full backup for compatibility
            const selectiveBackupData = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                description: 'Selective Portfolio Pilot backup - includes only transaction history, cash/savings accounts, CS2 portfolio, and deposits/withdrawals',
                data: {
                    // Portfolio data (only static assets and CS2)
                    portfolio: selectivePortfolio,
                    
                    // Transaction history (stocks, ETFs, crypto only)
                    transactions: selectedTransactions,
                    
                    // Deposits and withdrawals in the expected format
                    deposits: depositsAndWithdrawals.filter(tx => tx.type === 'deposit'),
                    withdrawals: depositsAndWithdrawals.filter(tx => tx.type === 'withdrawal'),
                    
                    // Include minimal required fields as null to maintain compatibility
                    validatedHistory: null,
                    priceCache: null,
                    eurUsdRate: null,
                    historicalRates: null,
                    soldAssetsCache: null,
                    cryptoRates: null,
                    benchmarkData: null,
                    benchmarkHistory: null,
                    benchmarkDataByDate: null,
                    stockEarnings: null,
                    cryptoEvents: null,
                    lastUpdate: null,
                    notes: null,
                    apiKeys: null,
                    usageStats: null
                }
            };

            // Create and download the backup file
            const dataStr = JSON.stringify(selectiveBackupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `portfolio-selective-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('Selective portfolio backup created successfully!', 'success');
        } catch (error) {
            console.error('Error creating selective backup:', error);
            showNotification('Error creating selective backup. Please try again.', 'error');
        }
    }

    // Export functions for use in other files
    window.getApiKey = getApiKey;
    window.trackApiUsage = trackApiUsage;
    window.exportSelectiveData = exportSelectiveData;
});
