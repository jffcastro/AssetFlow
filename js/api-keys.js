// API Keys page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const fhApiKeyInput = document.getElementById('fh-api-key');
    const fhStatus = document.getElementById('fh-status');
    const saveFhBtn = document.getElementById('save-fh-btn');
    
    const cmcApiKeyInput = document.getElementById('cmc-api-key');
    const cmcStatus = document.getElementById('cmc-status');
    const saveCmcBtn = document.getElementById('save-cmc-btn');
    
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    const fhUsage = document.getElementById('fh-usage');
    const cmcUsage = document.getElementById('cmc-usage');
    
    // Event listeners
    saveFhBtn.addEventListener('click', saveFinnhubKey);
    saveCmcBtn.addEventListener('click', saveCoinMarketCalKey);
    refreshStatsBtn.addEventListener('click', refreshUsageStats);
    
    // Initialize page
    loadApiKeys();
    updateApiStatuses();
    loadUsageStats();
    initializeNotes();
});


// Finnhub API functions
function saveFinnhubKey() {
    const apiKey = document.getElementById('fh-api-key').value.trim();
    
    if (!apiKey) {
        showNotification('Please enter your Finnhub API key', 'error');
        return;
    }
    
    const fhConfig = {
        apiKey: apiKey,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('portfolioPilotFinnhub', JSON.stringify(fhConfig));
    showNotification('Finnhub API key saved successfully!', 'success');
    updateApiStatuses();
}

function loadFinnhubKey() {
    const config = localStorage.getItem('portfolioPilotFinnhub');
    if (config) {
        const parsed = JSON.parse(config);
        document.getElementById('fh-api-key').value = parsed.apiKey || '';
        return parsed;
    }
    return null;
}

// CoinMarketCal API functions
function saveCoinMarketCalKey() {
    const apiKey = document.getElementById('cmc-api-key').value.trim();
    
    if (!apiKey) {
        showNotification('Please enter your CoinMarketCal API key', 'error');
        return;
    }
    
    const cmcConfig = {
        apiKey: apiKey,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('portfolioPilotCoinMarketCal', JSON.stringify(cmcConfig));
    showNotification('CoinMarketCal API key saved successfully!', 'success');
    updateApiStatuses();
}

function loadCoinMarketCalKey() {
    const config = localStorage.getItem('portfolioPilotCoinMarketCal');
    if (config) {
        const parsed = JSON.parse(config);
        document.getElementById('cmc-api-key').value = parsed.apiKey || '';
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
    const fhConfig = localStorage.getItem('portfolioPilotFinnhub');
    const cmcConfig = localStorage.getItem('portfolioPilotCoinMarketCal');
    
    // Finnhub status
    if (fhConfig) {
        const parsed = JSON.parse(fhConfig);
        if (parsed.apiKey) {
            document.getElementById('fh-status').textContent = 'Configured';
            document.getElementById('fh-status').className = 'text-xs px-2 py-1 rounded-full bg-green-700 text-green-100';
        } else {
            document.getElementById('fh-status').textContent = 'Incomplete';
            document.getElementById('fh-status').className = 'text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-100';
        }
    } else {
        document.getElementById('fh-status').textContent = 'Not Configured';
        document.getElementById('fh-status').className = 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300';
    }
    
    // CoinMarketCal status
    if (cmcConfig) {
        const parsed = JSON.parse(cmcConfig);
        if (parsed.apiKey) {
            document.getElementById('cmc-status').textContent = 'Configured';
            document.getElementById('cmc-status').className = 'text-xs px-2 py-1 rounded-full bg-green-700 text-green-100';
        } else {
            document.getElementById('cmc-status').textContent = 'Incomplete';
            document.getElementById('cmc-status').className = 'text-xs px-2 py-1 rounded-full bg-yellow-700 text-yellow-100';
        }
    } else {
        document.getElementById('cmc-status').textContent = 'Not Configured';
        document.getElementById('cmc-status').className = 'text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300';
    }
}

// Usage statistics functions
function loadUsageStats() {
    const today = new Date().toDateString();
    const fhUsageData = JSON.parse(localStorage.getItem('portfolioPilotFinnhubUsage') || '{}');
    const cmcUsageData = JSON.parse(localStorage.getItem('portfolioPilotCoinMarketCalUsage') || '{}');
    
    document.getElementById('fh-usage').textContent = `${fhUsageData[today] || 0} calls today`;
    document.getElementById('cmc-usage').textContent = `${cmcUsageData[today] || 0} calls today`;
}

function refreshUsageStats() {
    loadUsageStats();
    showNotification('Usage statistics refreshed', 'success');
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
    const config = localStorage.getItem(`portfolioPilot${apiName}`);
    if (config) {
        const parsed = JSON.parse(config);
        return parsed.apiKey;
    }
    return null;
}

// Notes functionality
function initializeNotes() {
    const notesTextarea = document.getElementById('api-notes');
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
    const notesTextarea = document.getElementById('api-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const notes = localStorage.getItem('apiNotes') || '';
        notesTextarea.value = notes;
        updateCharCount();
    }
}

function autoSaveNotes() {
    const notesTextarea = document.getElementById('api-notes');
    
    if (notesTextarea) {
        const notes = notesTextarea.value;
        localStorage.setItem('apiNotes', notes);
    }
}

function updateCharCount() {
    const notesTextarea = document.getElementById('api-notes');
    const charCount = document.getElementById('notes-char-count');
    
    if (notesTextarea && charCount) {
        const count = notesTextarea.value.length;
        charCount.textContent = count;
    }
}

// Export functions for use in other files
window.getApiKey = getApiKey;
window.trackApiUsage = trackApiUsage;
