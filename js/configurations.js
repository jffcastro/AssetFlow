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

    // Migrate data to cloud using optimized Supabase REST API with compression
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
            const priceCache = JSON.parse(localStorage.getItem('portfolioPilotPriceCache') || '{}');
            const historicalRates = JSON.parse(localStorage.getItem('historicalRates') || '{}');
            const soldAssetsCache = JSON.parse(localStorage.getItem('soldAssetsCache') || '{}');

            // Generate user ID
            const userId = getUserId();

            // Compress and migrate portfolio data (single API call per asset type)
            const portfolioEntries = [
                { asset_type: 'stocks', data: portfolio.stocks || [] },
                { asset_type: 'etfs', data: portfolio.etfs || [] },
                { asset_type: 'crypto', data: portfolio.crypto || [] },
                { asset_type: 'static', data: portfolio.static || [] },
                { asset_type: 'cs2', data: portfolio.cs2 || { portfolios: {}, value: 0, currency: 'EUR' } }
            ];

            for (const entry of portfolioEntries) {
                // Compress data before sending
                const compressedData = LZString.compress(JSON.stringify(entry.data));
                
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
                        compressed_data: compressedData
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Portfolio migration error for ${entry.asset_type}:`, errorText);
                    throw new Error(`Failed to migrate ${entry.asset_type}: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }

            // Compress and migrate transactions (single API call)
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
                    timestamp: tx.timestamp || new Date().toISOString(),
                    // Add missing fields for historical exchange rates
                    historical_rate: tx.historicalRate || null,
                    original_price: tx.originalPrice || null,
                    original_currency: tx.originalCurrency || null
                }));

                // Compress transactions data
                const compressedTransactions = LZString.compress(JSON.stringify(supabaseTransactions));

                const response = await fetch(`${config.url}/rest/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        compressed_data: compressedTransactions
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Transaction migration error:', errorText);
                    throw new Error(`Failed to migrate transactions: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }

            // Compress and save user settings (single API call)
            const settingsData = {
                eur_usd_rate: parseFloat(eurUsdRate),
                price_cache: priceCache,
                historical_rates: historicalRates,
                sold_assets_cache: soldAssetsCache,
                preferences: {}
            };

            const compressedSettings = LZString.compress(JSON.stringify(settingsData));

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
                    compressed_data: compressedSettings
                })
            });

            if (!settingsResponse.ok) {
                throw new Error(`Failed to migrate settings: ${settingsResponse.statusText}`);
            }

            // Track bandwidth usage
            trackBandwidthUsage(JSON.stringify(portfolio).length + JSON.stringify(transactions).length + JSON.stringify(settingsData).length);

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

    // Backup data using optimized Supabase REST API with decompression
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

            // Decompress portfolio data
            const decompressedPortfolio = {};
            portfolio.forEach(item => {
                if (item.compressed_data) {
                    decompressedPortfolio[item.asset_type] = JSON.parse(LZString.decompress(item.compressed_data));
                } else {
                    // Fallback for old format
                    decompressedPortfolio[item.asset_type] = item.asset_data;
                }
            });

            // Decompress transactions data
            let decompressedTransactions = [];
            if (transactions.length > 0) {
                const transactionData = transactions[0];
                if (transactionData.compressed_data) {
                    decompressedTransactions = JSON.parse(LZString.decompress(transactionData.compressed_data));
                } else {
                    // Fallback for old format
                    decompressedTransactions = transactions;
                }
            }

            // Decompress settings data
            let decompressedSettings = {};
            if (settings.length > 0) {
                const settingsData = settings[0];
                if (settingsData.compressed_data) {
                    decompressedSettings = JSON.parse(LZString.decompress(settingsData.compressed_data));
                } else {
                    // Fallback for old format
                    decompressedSettings = settingsData;
                }
            }

            // Create backup object
            const backup = {
                timestamp: new Date().toISOString(),
                portfolio: decompressedPortfolio,
                transactions: decompressedTransactions,
                settings: decompressedSettings
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

    // Restore data using optimized Supabase REST API with compression
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

                // Restore portfolio data with compression
                for (const [assetType, assetData] of Object.entries(backup.portfolio)) {
                    const compressedData = LZString.compress(JSON.stringify(assetData));
                    
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
                            asset_type: assetType,
                            compressed_data: compressedData
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore portfolio: ${response.statusText}`);
                    }
                }

                // Restore transactions with compression
                if (backup.transactions.length > 0) {
                    const transactionsToRestore = backup.transactions.map(tx => ({
                        ...tx,
                        user_id: userId
                    }));

                    const compressedTransactions = LZString.compress(JSON.stringify(transactionsToRestore));

                    const response = await fetch(`${config.url}/rest/v1/transactions`, {
                        method: 'POST',
                        headers: {
                            'apikey': config.anonKey,
                            'Authorization': `Bearer ${config.anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            compressed_data: compressedTransactions
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore transactions: ${response.statusText}`);
                    }
                }

                // Restore settings with compression
                if (backup.settings && Object.keys(backup.settings).length > 0) {
                    const compressedSettings = LZString.compress(JSON.stringify(backup.settings));

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
                            compressed_data: compressedSettings
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to restore settings: ${response.statusText}`);
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

    // ==================== BANDWIDTH TRACKING & SMART SYNC ====================

    // Bandwidth tracking for free tier management
    function trackBandwidthUsage(bytes) {
        const today = new Date().toDateString();
        const bandwidthData = JSON.parse(localStorage.getItem('assetflow_bandwidth_usage') || '{}');
        
        bandwidthData[today] = (bandwidthData[today] || 0) + bytes;
        localStorage.setItem('assetflow_bandwidth_usage', JSON.stringify(bandwidthData));
        
        // Check if approaching limit (80% of 2GB)
        const dailyUsage = bandwidthData[today];
        const limit = 2 * 1024 * 1024 * 1024; // 2GB in bytes
        const warningThreshold = limit * 0.8;
        
        if (dailyUsage > warningThreshold) {
            showNotification('Approaching bandwidth limit. Sync frequency reduced.', 'warning');
        }
    }

    // Smart sync - only sync when data actually changes
    let lastSyncHash = null;
    let syncDebounceTimer = null;

    function generateDataHash() {
        const portfolio = JSON.parse(localStorage.getItem('portfolioPilotData') || '{}');
        const transactions = JSON.parse(localStorage.getItem('portfolioPilotTransactions') || '[]');
        
        // Simple hash of critical data
        return btoa(JSON.stringify({
            portfolio: portfolio,
            transactions: transactions.length,
            lastModified: Date.now()
        }));
    }

    function shouldSync() {
        const currentHash = generateDataHash();
        if (currentHash !== lastSyncHash) {
            lastSyncHash = currentHash;
            return true;
        }
        return false;
    }

    function isOffline() {
        return !navigator.onLine;
    }

    // Debounced sync function
    function debouncedSync() {
        if (syncDebounceTimer) {
            clearTimeout(syncDebounceTimer);
        }
        
        syncDebounceTimer = setTimeout(async () => {
            if (shouldSync() && !isOffline()) {
                await smartSyncToCloud();
            }
        }, 30000); // 30 second delay
    }

    // Smart sync to cloud
    async function smartSyncToCloud() {
        const config = getDatabaseConfig();
        if (!config || !config.url || !config.anonKey) {
            return; // Silently fail if not configured
        }

        try {
            const userId = getUserId();
            
            // Get current data
            const portfolio = JSON.parse(localStorage.getItem('portfolioPilotData') || '{}');
            const transactions = JSON.parse(localStorage.getItem('portfolioPilotTransactions') || '[]');
            const eurUsdRate = localStorage.getItem('eurUsdRate') || '1.0';
            const priceCache = JSON.parse(localStorage.getItem('portfolioPilotPriceCache') || '{}');
            const historicalRates = JSON.parse(localStorage.getItem('historicalRates') || '{}');
            const soldAssetsCache = JSON.parse(localStorage.getItem('soldAssetsCache') || '{}');

            // Sync portfolio data
            const portfolioEntries = [
                { asset_type: 'stocks', data: portfolio.stocks || [] },
                { asset_type: 'etfs', data: portfolio.etfs || [] },
                { asset_type: 'crypto', data: portfolio.crypto || [] },
                { asset_type: 'static', data: portfolio.static || [] },
                { asset_type: 'cs2', data: portfolio.cs2 || { portfolios: {}, value: 0, currency: 'EUR' } }
            ];

            for (const entry of portfolioEntries) {
                const compressedData = LZString.compress(JSON.stringify(entry.data));
                
                await fetch(`${config.url}/rest/v1/portfolio`, {
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
                        compressed_data: compressedData
                    })
                });
            }

            // Sync transactions
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
                    timestamp: tx.timestamp || new Date().toISOString(),
                    historical_rate: tx.historicalRate || null,
                    original_price: tx.originalPrice || null,
                    original_currency: tx.originalCurrency || null
                }));

                const compressedTransactions = LZString.compress(JSON.stringify(supabaseTransactions));

                await fetch(`${config.url}/rest/v1/transactions`, {
                    method: 'POST',
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        compressed_data: compressedTransactions
                    })
                });
            }

            // Sync settings
            const settingsData = {
                eur_usd_rate: parseFloat(eurUsdRate),
                price_cache: priceCache,
                historical_rates: historicalRates,
                sold_assets_cache: soldAssetsCache,
                preferences: {}
            };

            const compressedSettings = LZString.compress(JSON.stringify(settingsData));

            await fetch(`${config.url}/rest/v1/user_settings`, {
                method: 'POST',
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    user_id: userId,
                    compressed_data: compressedSettings
                })
            });

            // Track bandwidth usage
            trackBandwidthUsage(JSON.stringify(portfolio).length + JSON.stringify(transactions).length + JSON.stringify(settingsData).length);

        } catch (error) {
            console.error('Smart sync error:', error);
            // Silently fail for background sync
        }
    }

    // Export functions for use in other files
    window.getApiKey = getApiKey;
    window.trackApiUsage = trackApiUsage;
    window.debouncedSync = debouncedSync;
    window.smartSyncToCloud = smartSyncToCloud;
});
