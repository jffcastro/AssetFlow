// Database configuration and management using Supabase REST API
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
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
    const statusDescription = document.getElementById('status-description');
    const migrationStatus = document.getElementById('migration-status');

    // Initialize page
    loadDatabaseConfig();
    updateDatabaseStatus();

    // Event listeners
    databaseConfigForm.addEventListener('submit', saveDatabaseConfig);
    testConnectionBtn.addEventListener('click', testDatabaseConnection);
    clearConfigBtn.addEventListener('click', clearDatabaseConfig);
    migrateDataBtn.addEventListener('click', migrateDataToCloud);
    backupDataBtn.addEventListener('click', backupData);
    restoreDataBtn.addEventListener('click', restoreData);

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
        localStorage.setItem('assetflow_database_config', JSON.stringify(config));
        
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
                settings: settings[0] || {}
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
                statusDescription.textContent = 'Database connection is active and working properly.';
                break;
            case 'error':
                statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                statusText.textContent = 'Connection Error';
                statusDescription.textContent = 'Failed to connect to database. Please check your configuration.';
                break;
            case 'not-configured':
                statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-500';
                statusText.textContent = 'Not Configured';
                statusDescription.textContent = 'Configure your database connection to enable cloud storage and multi-device sync.';
                break;
            default:
                statusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-500';
                statusText.textContent = 'Not Connected';
                statusDescription.textContent = 'Database configuration saved but not tested. Click "Test Connection" to verify.';
        }
    }

    // Helper functions
    function getDatabaseConfig() {
        try {
            const config = localStorage.getItem('assetflow_database_config');
            return config ? JSON.parse(config) : null;
        } catch {
            return null;
        }
    }

    function getUserId() {
        let userId = localStorage.getItem('assetflow_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('assetflow_user_id', userId);
        }
        return userId;
    }
});