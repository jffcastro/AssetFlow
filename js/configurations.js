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
    
    // Database DOM elements
    const databaseConfigForm = document.getElementById('database-config-form');
    const testConnectionBtn = document.getElementById('test-connection-btn');
    const clearConfigBtn = document.getElementById('clear-config-btn');
    const migrateDataBtn = document.getElementById('migrate-data-btn');
    const backupDataBtn = document.getElementById('backup-data-btn');
    const restoreDataBtn = document.getElementById('restore-data-btn');
    
    const supabaseUrlInput = document.getElementById('supabase-url');
    const supabaseAnonKeyInput = document.getElementById('supabase-anon-key');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const migrationStatus = document.getElementById('migration-status');
    
    // Notes elements
    const configNotesTextarea = document.getElementById('config-notes');
    const charCount = document.getElementById('notes-char-count');

    // Initialize page
    loadApiKeys();
    updateApiStatuses();
    loadUsageStats();
    loadDatabaseConfig();
    updateDatabaseStatus();
    initializeNotes();

    // API Keys Event listeners
    saveFhBtn.addEventListener('click', saveFinnhubKey);
    saveCmcBtn.addEventListener('click', saveCoinMarketCalKey);

    // Database Event listeners
    databaseConfigForm.addEventListener('submit', saveDatabaseConfig);
    testConnectionBtn.addEventListener('click', testDatabaseConnection);
    clearConfigBtn.addEventListener('click', clearDatabaseConfig);
    migrateDataBtn.addEventListener('click', migrateDataToCloud);
    backupDataBtn.addEventListener('click', backupData);
    restoreDataBtn.addEventListener('click', restoreData);
    
    // Migration Event listener
    const migrateRatesBtn = document.getElementById('migrate-rates-btn');
    if (migrateRatesBtn) {
        migrateRatesBtn.addEventListener('click', migrateHistoricalRates);
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

    // Load all API keys
    function loadApiKeys() {
        loadFinnhubKey();
        loadCoinMarketCalKey();
    }

    // Update API status indicators
    function updateApiStatuses() {
        const fhConfig = getEncryptedItem('portfolioPilotFinnhub');
        const cmcConfig = getEncryptedItem('portfolioPilotCoinMarketCal');
        
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
    }

    // Usage statistics functions
    function loadUsageStats() {
        const today = new Date().toDateString();
        const fhUsageData = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
        const cmcUsageData = JSON.parse(localStorage.getItem('portfolioPilotCoinMarketCalUsage') || '{}');
        
        fhUsage.textContent = `${fhUsageData[today] || 0} calls today`;
        cmcUsage.textContent = `${cmcUsageData[today] || 0} calls today`;
    }

    // ==================== DATABASE FUNCTIONS ====================

    // Load saved database configuration
    function loadDatabaseConfig() {
        const config = getDatabaseConfig();
        if (config) {
            supabaseUrlInput.value = config.url || '';
            supabaseAnonKeyInput.value = config.anonKey || '';
        }
    }

    // Save database configuration
    function saveDatabaseConfig(e) {
        e.preventDefault();
        
        const config = {
            url: supabaseUrlInput.value.trim(),
            anonKey: supabaseAnonKeyInput.value.trim()
        };

        if (!config.url || !config.anonKey) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Validate URL format
        try {
            new URL(config.url);
        } catch {
            showNotification('Please enter a valid Supabase URL', 'error');
            return;
        }

        // Save configuration
        setEncryptedItem('assetflow_database_config', JSON.stringify(config));
        
        showNotification('Database configuration saved successfully!', 'success');
        updateDatabaseStatus();
    }

    // Test database connection using Supabase REST API
    async function testDatabaseConnection() {
        const config = getDatabaseConfig();
        if (!config || !config.url || !config.anonKey) {
            showNotification('Please configure database settings first', 'error');
            return;
        }

        testConnectionBtn.textContent = 'Testing...';
        testConnectionBtn.disabled = true;

        try {
            // Test connection by making a simple query to the portfolio table
            const response = await fetch(`${config.url}/rest/v1/portfolio?select=count&limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // Table doesn't exist yet, but connection works
                    showNotification('Connection successful! Please create the database tables first by running the SQL schema in your Supabase SQL Editor.', 'warning');
                    updateDatabaseStatus('connected');
                } else {
                    const errorText = await response.text();
                    throw new Error(`Connection failed: ${response.status} ${response.statusText} - ${errorText}`);
                }
            } else {
                showNotification('Database connection successful!', 'success');
                updateDatabaseStatus('connected');
            }
            
        } catch (error) {
            console.error('Database connection error:', error);
            showNotification(`Connection failed: ${error.message}`, 'error');
            updateDatabaseStatus('error');
        } finally {
            testConnectionBtn.textContent = 'Test Connection';
            testConnectionBtn.disabled = false;
        }
    }

    // Clear database configuration
    function clearDatabaseConfig() {
        if (confirm('Are you sure you want to clear the database configuration?')) {
            localStorage.removeItem('assetflow_database_config');
            supabaseUrlInput.value = '';
            supabaseAnonKeyInput.value = '';
            updateDatabaseStatus();
            showNotification('Database configuration cleared', 'success');
        }
    }

    // Migrate data to cloud using Supabase REST API
    async function migrateDataToCloud() {
        const config = getDatabaseConfig();
        if (!config || !config.url || !config.anonKey) {
            showNotification('Please configure database settings first', 'error');
            return;
        }

        if (!confirm('This will migrate your local data to the cloud. Continue?')) {
            return;
        }

        migrateDataBtn.textContent = 'Migrating...';
        migrateDataBtn.disabled = true;
        migrationStatus.textContent = 'Migrating data...';

        try {
            // Get current data
            const portfolio = JSON.parse(localStorage.getItem('portfolioPilotData') || '{}');
            const transactions = JSON.parse(localStorage.getItem('portfolioPilotTransactions') || '[]');
            const eurUsdRate = localStorage.getItem('eurUsdRate') || '1.0';
            const priceCache = JSON.parse(localStorage.getItem('priceCache') || '{}');

            // Generate user ID
            const userId = getUserId();

            // Migrate portfolio data
            const portfolioEntries = [
                { asset_type: 'stocks', data: portfolio.stocks || [] },
                { asset_type: 'etfs', data: portfolio.etfs || [] },
                { asset_type: 'crypto', data: portfolio.crypto || [] },
                { asset_type: 'static', data: portfolio.static || [] },
                { asset_type: 'cs2', data: portfolio.cs2 || { value: 0, currency: 'EUR' } }
            ];

            for (const entry of portfolioEntries) {
                const response = await fetch(`${config.url}/rest/v1/portfolio`, {
                    method: 'POST',
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        asset_type: entry.asset_type,
                        asset_data: entry.data
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Portfolio migration error for ${entry.asset_type}:`, errorText);
                    throw new Error(`Failed to migrate ${entry.asset_type}: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }

            // Migrate transactions
            if (transactions.length > 0) {
                const supabaseTransactions = transactions.map(tx => ({
                    id: tx.id,
                    user_id: userId,
                    type: tx.type,
                    asset_type: tx.assetType,
                    symbol: tx.symbol,
                    quantity: tx.quantity,
                    price: tx.price,
                    total: tx.total,
                    currency: tx.currency,
                    date: tx.date,
                    note: tx.note,
                    timestamp: tx.timestamp || new Date().toISOString()
                }));

                const response = await fetch(`${config.url}/rest/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(supabaseTransactions)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Transaction migration error:', errorText);
                    throw new Error(`Failed to migrate transactions: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }

            // Save user settings
            const settingsResponse = await fetch(`${config.url}/rest/v1/user_settings`, {
                method: 'POST',
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    user_id: userId,
                    eur_usd_rate: parseFloat(eurUsdRate),
                    price_cache: priceCache,
                    preferences: {}
                })
            });

            if (!settingsResponse.ok) {
                throw new Error(`Failed to migrate settings: ${settingsResponse.statusText}`);
            }

            showNotification('Data migrated to cloud successfully!', 'success');
            migrationStatus.textContent = 'Migration completed';
            updateDatabaseStatus('connected');

        } catch (error) {
            console.error('Migration error:', error);
            showNotification(`Migration failed: ${error.message}`, 'error');
            migrationStatus.textContent = 'Migration failed';
        } finally {
            migrateDataBtn.textContent = 'Migrate to Cloud';
            migrateDataBtn.disabled = false;
        }
    }

    // Backup data using Supabase REST API
    async function backupData() {
        const config = getDatabaseConfig();
        if (!config || !config.url || !config.anonKey) {
            showNotification('Please configure database settings first', 'error');
            return;
        }

        try {
            const userId = getUserId();

            // Get all data from cloud
            const [portfolioResponse, transactionsResponse, settingsResponse] = await Promise.all([
                fetch(`${config.url}/rest/v1/portfolio?user_id=eq.${userId}`, {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                }),
                fetch(`${config.url}/rest/v1/transactions?user_id=eq.${userId}`, {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                }),
                fetch(`${config.url}/rest/v1/user_settings?user_id=eq.${userId}`, {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                })
            ]);

            if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio data');
            if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions data');
            if (!settingsResponse.ok) throw new Error('Failed to fetch settings data');

            const [portfolio, transactions, settings] = await Promise.all([
                portfolioResponse.json(),
                transactionsResponse.json(),
                settingsResponse.json()
            ]);

            // Create backup object
            const backup = {
                timestamp: new Date().toISOString(),
                portfolio: portfolio,
                transactions: transactions,
                settings: settings[0] || {},
                // Include local data that's not in the database
                localData: {
                    historicalExchangeRates: JSON.parse(localStorage.getItem('historicalExchangeRates') || '{}'),
                    eurUsdRate: localStorage.getItem('eurUsdRate') || '1.0',
                    priceCache: JSON.parse(localStorage.getItem('portfolioPilotPriceCache') || '{}'),
                    cryptoRates: localStorage.getItem('portfolioPilotCryptoRates'),
                    notes: {
                        stocks: localStorage.getItem('stocksNotes') || '',
                        etfs: localStorage.getItem('etfsNotes') || '',
                        crypto: localStorage.getItem('cryptoNotes') || '',
                        cs2: localStorage.getItem('cs2Notes') || ''
                    }
                }
            };

            // Download backup file
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assetflow-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('Backup downloaded successfully!', 'success');

        } catch (error) {
            console.error('Backup error:', error);
            showNotification(`Backup failed: ${error.message}`, 'error');
        }
    }

    // Restore data using Supabase REST API
    function restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const backup = JSON.parse(text);

                if (!backup.portfolio || !backup.transactions) {
                    throw new Error('Invalid backup file format');
                }

                if (!confirm('This will replace your current data. Continue?')) {
                    return;
                }

                const config = getDatabaseConfig();
                if (!config || !config.url || !config.anonKey) {
                    showNotification('Please configure database settings first', 'error');
                    return;
                }

                const userId = getUserId();

                // Restore portfolio data
                for (const portfolioItem of backup.portfolio) {
                    const response = await fetch(`${config.url}/rest/v1/portfolio`, {
                        method: 'POST',
                        headers: {
                            'apikey': config.anonKey,
                            'Authorization': `Bearer ${config.anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            asset_type: portfolioItem.asset_type,
                            asset_data: portfolioItem.asset_data
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore portfolio: ${response.statusText}`);
                    }
                }

                // Restore transactions
                if (backup.transactions.length > 0) {
                    const transactionsToRestore = backup.transactions.map(tx => ({
                        ...tx,
                        user_id: userId
                    }));

                    const response = await fetch(`${config.url}/rest/v1/transactions`, {
                        method: 'POST',
                        headers: {
                            'apikey': config.anonKey,
                            'Authorization': `Bearer ${config.anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify(transactionsToRestore)
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore transactions: ${response.statusText}`);
                    }
                }

                // Restore settings
                if (backup.settings && Object.keys(backup.settings).length > 0) {
                    const response = await fetch(`${config.url}/rest/v1/user_settings`, {
                        method: 'POST',
                        headers: {
                            'apikey': config.anonKey,
                            'Authorization': `Bearer ${config.anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            eur_usd_rate: backup.settings.eur_usd_rate,
                            price_cache: backup.settings.price_cache,
                            preferences: backup.settings.preferences
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore settings: ${response.statusText}`);
                    }
                }

                // Restore local data (historical exchange rates, notes, etc.)
                if (backup.localData) {
                    if (backup.localData.historicalExchangeRates) {
                        localStorage.setItem('historicalExchangeRates', JSON.stringify(backup.localData.historicalExchangeRates));
                    }
                    if (backup.localData.eurUsdRate) {
                        localStorage.setItem('eurUsdRate', backup.localData.eurUsdRate);
                    }
                    if (backup.localData.priceCache) {
                        localStorage.setItem('portfolioPilotPriceCache', JSON.stringify(backup.localData.priceCache));
                    }
                    if (backup.localData.cryptoRates) {
                        localStorage.setItem('portfolioPilotCryptoRates', backup.localData.cryptoRates);
                    }
                    if (backup.localData.notes) {
                        if (backup.localData.notes.stocks) localStorage.setItem('stocksNotes', backup.localData.notes.stocks);
                        if (backup.localData.notes.etfs) localStorage.setItem('etfsNotes', backup.localData.notes.etfs);
                        if (backup.localData.notes.crypto) localStorage.setItem('cryptoNotes', backup.localData.notes.crypto);
                        if (backup.localData.notes.cs2) localStorage.setItem('cs2Notes', backup.localData.notes.cs2);
                    }
                }

                showNotification('Data restored successfully!', 'success');
                updateDatabaseStatus('connected');

            } catch (error) {
                console.error('Restore error:', error);
                showNotification(`Restore failed: ${error.message}`, 'error');
            }
        };
        input.click();
    }

    // Update database status display
    function updateDatabaseStatus(status = 'disconnected') {
        const config = getDatabaseConfig();
        
        if (!config || !config.url || !config.anonKey) {
            status = 'not-configured';
        }

        switch (status) {
            case 'connected':
                statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
                statusText.textContent = 'Connected';
                break;
            case 'error':
                statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                statusText.textContent = 'Connection Error';
                break;
            case 'not-configured':
                statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-500';
                statusText.textContent = 'Not Configured';
                break;
            default:
                statusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-500';
                statusText.textContent = 'Not Connected';
        }
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

    // Migration function for historical exchange rates
    async function migrateHistoricalRates() {
        const migrateRatesBtn = document.getElementById('migrate-rates-btn');
        const progressDiv = document.getElementById('migration-progress');
        const statusSpan = document.getElementById('migration-status');
        
        if (!migrateRatesBtn || !progressDiv) {
            showNotification('Migration UI elements not found', 'error');
            return;
        }
        
        // Confirm migration
        if (!confirm('This will update all your existing USD transactions with historical exchange rates. This may take a few minutes. Continue?')) {
            return;
        }
        
        try {
            // Update UI
            migrateRatesBtn.disabled = true;
            migrateRatesBtn.textContent = 'Migrating...';
            progressDiv.classList.remove('hidden');
            if (statusSpan) statusSpan.textContent = 'Migration in progress...';
            
            // Run migration
            const result = await migrateExistingTransactionsToHistoricalRates();
            
            if (result.success) {
                showNotification(result.message, 'success');
                if (statusSpan) statusSpan.textContent = `Migration completed: ${result.updated} transactions updated`;
                
                // Update progress bar to 100%
                const progressBar = progressDiv.querySelector('.bg-emerald-400');
                const progressText = progressDiv.querySelector('.text-center');
                if (progressBar) progressBar.style.width = '100%';
                if (progressText) progressText.textContent = 'Migration completed!';
                
                // Hide progress after 3 seconds
                setTimeout(() => {
                    progressDiv.classList.add('hidden');
                }, 3000);
                
            } else {
                showNotification(result.message, 'error');
                if (statusSpan) statusSpan.textContent = 'Migration failed';
            }
            
        } catch (error) {
            console.error('Migration error:', error);
            showNotification(`Migration failed: ${error.message}`, 'error');
            if (statusSpan) statusSpan.textContent = 'Migration failed';
        } finally {
            // Reset button
            migrateRatesBtn.disabled = false;
            migrateRatesBtn.textContent = 'Migrate Exchange Rates';
        }
    }

    function getDatabaseConfig() {
        try {
            const config = getEncryptedItem('assetflow_database_config');
            return config ? JSON.parse(config) : null;
        } catch {
            return null;
        }
    }

    function getUserId() {
        let userId = localStorage.getItem('assetflow_user_id');
        if (!userId) {
            // Generate a cryptographically secure unique user ID
            const randomArray = window.crypto.getRandomValues(new Uint8Array(9));
            const randomString = Array.from(randomArray, b => b.toString(36)).join('').substr(0, 9);
            userId = 'user_' + Date.now() + '_' + randomString;
            localStorage.setItem('assetflow_user_id', userId);
        }
        return userId;
    }

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

    // Export functions for use in other files
    window.getApiKey = getApiKey;
    window.trackApiUsage = trackApiUsage;
});
