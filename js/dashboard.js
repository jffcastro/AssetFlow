// Dashboard-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    initializePortfolioChart();
    initializeMultiCurrencyChart();
    initializePortfolioBreakdownChart();
    initializeBenchmarkComparisonChart();
    initializeCorrelationMatrixChart();
    initializeRetirementChart();
    
    // Setup retirement chart controls
    setupRetirementControls();
    
    // Update dashboard stats
    updateDashboardStats();
    updateCashFlowSummary();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load performance summaries
    loadMonthlyPerformance();
    loadYearlyPerformance();
    
    // Update auto-updates status
    updateAutoUpdatesStatus();
    
    
    // Start scheduled updates
    startScheduledUpdates();
    
    // Set up validate history button
    const validateHistoryBtn = document.getElementById('validate-history-btn');
    if (validateHistoryBtn) {
        validateHistoryBtn.addEventListener('click', addToHistory);
    }
});

function initializePortfolioChart() {
    const ctx = document.getElementById('portfolio-chart');
    if (!ctx) return;
    
    const validatedHistory = loadValidatedHistory();
    const labels = validatedHistory.map(entry => entry.date);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Portfolio',
                    data: validatedHistory.map(entry => entry.total || 0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Stocks',
                    data: validatedHistory.map(entry => entry.stocks || 0),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'ETFs',
                    data: validatedHistory.map(entry => entry.etfs || 0),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Crypto',
                    data: validatedHistory.map(entry => entry.crypto || 0),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Cash & Savings',
                    data: validatedHistory.map(entry => entry.static || 0),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'CS2 Items',
                    data: validatedHistory.map(entry => entry.cs2 || 0),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function initializeMultiCurrencyChart() {
    const ctx = document.getElementById('portfolio-multicurrency-chart');
    if (!ctx) return;
    
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length === 0) return;
    
    const labels = validatedHistory.map(entry => entry.date);
    const eurData = validatedHistory.map(entry => entry.eur || 0);
    const usdData = validatedHistory.map(entry => entry.usd || 0);
    const btcData = validatedHistory.map(entry => entry.btc || 0);
    const ethData = validatedHistory.map(entry => entry.eth || 0);
    
    // Normalize all values to start at 100 for easy comparison
    const normalizeToIndex = (data) => {
        if (data.length === 0) return [];
        const firstValue = data[0];
        if (firstValue === 0) return data.map(() => 0);
        return data.map(value => (value / firstValue) * 100);
    };
    
    const eurIndex = normalizeToIndex(eurData);
    const usdIndex = normalizeToIndex(usdData);
    const btcIndex = normalizeToIndex(btcData);
    const ethIndex = normalizeToIndex(ethData);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Portfolio (EUR) - Main Currency',
                    data: eurIndex,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Portfolio (USD)',
                    data: usdIndex,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'BTC',
                    data: btcIndex,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'ETH',
                    data: ethIndex,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        },
                        filter: function(legendItem) {
                            // Make EUR label bold
                            if (legendItem.text.includes('EUR')) {
                                legendItem.font = { weight: 'bold', size: 13 };
                            }
                            return true;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const indexValue = context.parsed.y;
                            const originalValue = context.raw;
                            
                            // Get original data for this point
                            const dataIndex = context.dataIndex;
                            let originalData;
                            if (label.includes('EUR')) originalData = eurData[dataIndex];
                            else if (label.includes('USD')) originalData = usdData[dataIndex];
                            else if (label.includes('BTC')) originalData = btcData[dataIndex];
                            else if (label.includes('ETH')) originalData = ethData[dataIndex];
                            
                            const formattedValue = originalData ? 
                                (label.includes('EUR') ? `€${originalData.toLocaleString()}` :
                                 label.includes('USD') ? `$${originalData.toLocaleString()}` :
                                 label.includes('BTC') ? `₿${originalData.toFixed(6)}` :
                                 `Ξ${originalData.toFixed(6)}`) : '';
                            
                            return `${label}: ${formattedValue} (Index: ${indexValue.toFixed(1)})`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80, // Start a bit below 100 for better visualization
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Index Value (100 = Starting Point)',
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function initializeBenchmarkComparisonChart() {
    const ctx = document.getElementById('benchmark-comparison-chart');
    if (!ctx) return;
    
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length === 0) return;
    
    const labels = validatedHistory.map(entry => entry.date);
    const portfolioData = validatedHistory.map(entry => entry.eur || 0);
    
    // Normalize portfolio data to start at 100
    const portfolioIndex = normalizeToIndex(portfolioData);
    
    // Get optimized benchmark data from cached data by date
    let benchmarkData;
    
    // First try the new optimized approach (cached data by date)
    const optimizedData = generateOptimizedBenchmarkData(labels, portfolioData);
    if (optimizedData.sp500.some(val => val !== null) || optimizedData.nasdaq.some(val => val !== null)) {
        benchmarkData = optimizedData;
        console.log('Using optimized benchmark data from cached dates');
    } else {
        // Fallback to legacy benchmark history if available
        const benchmarkHistory = getCachedBenchmarkHistory();
        if (benchmarkHistory && benchmarkHistory.sp500History && benchmarkHistory.nasdaqHistory) {
            benchmarkData = generateRealBenchmarkData(labels, portfolioData, benchmarkHistory);
            console.log('Using legacy benchmark history data');
        } else {
            // Final fallback to generated data
            benchmarkData = generateBenchmarkComparisonData(labels.length);
            console.log('Using generated benchmark data');
        }
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Your Portfolio',
                    data: portfolioIndex,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'S&P 500',
                    data: benchmarkData.sp500,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'NASDAQ',
                    data: benchmarkData.nasdaq,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#d1d5db',
                    borderColor: '#4b5563',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            const index = context.dataIndex;
                            
                            if (datasetLabel === 'Your Portfolio') {
                                const actualValue = portfolioData[index];
                                return `${datasetLabel}: ${value.toFixed(1)} (€${actualValue.toLocaleString()})`;
                            } else if (datasetLabel === 'S&P 500') {
                                const actualValue = benchmarkData.sp500Values ? benchmarkData.sp500Values[index] : 'N/A';
                                return `${datasetLabel}: ${value.toFixed(1)} (${actualValue.toLocaleString()})`;
                            } else if (datasetLabel === 'NASDAQ') {
                                const actualValue = benchmarkData.nasdaqValues ? benchmarkData.nasdaqValues[index] : 'N/A';
                                return `${datasetLabel}: ${value.toFixed(1)} (${actualValue.toLocaleString()})`;
                            }
                            return `${datasetLabel}: ${value.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Performance Index (100 = Starting Point)',
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function normalizeToIndex(data) {
    if (data.length === 0) return [];
    const firstValue = data[0];
    if (firstValue === 0) return data.map(() => 0);
    return data.map(value => (value / firstValue) * 100);
}

function generateRealBenchmarkData(labels, portfolioData, benchmarkHistory) {
    const sp500Data = [];
    const nasdaqData = [];
    const sp500Values = [];
    const nasdaqValues = [];
    
    // Create a map of benchmark data by date for quick lookup
    const sp500Map = {};
    const nasdaqMap = {};
    
    benchmarkHistory.sp500History.forEach(item => {
        sp500Map[item.date] = item.value;
    });
    
    benchmarkHistory.nasdaqHistory.forEach(item => {
        nasdaqMap[item.date] = item.value;
    });
    
    // Find the starting values for normalization
    let sp500StartValue = null;
    let nasdaqStartValue = null;
    
    // Find the first available benchmark data
    for (const label of labels) {
        if (sp500Map[label] && sp500StartValue === null) {
            sp500StartValue = sp500Map[label];
        }
        if (nasdaqMap[label] && nasdaqStartValue === null) {
            nasdaqStartValue = nasdaqMap[label];
        }
        if (sp500StartValue && nasdaqStartValue) break;
    }
    
    // Generate normalized benchmark data
    labels.forEach((label, index) => {
        const sp500Value = sp500Map[label];
        const nasdaqValue = nasdaqMap[label];
        
        if (sp500Value && sp500StartValue) {
            const normalizedSp500 = (sp500Value / sp500StartValue) * 100;
            sp500Data.push(normalizedSp500);
            sp500Values.push(sp500Value);
        } else {
            sp500Data.push(null);
            sp500Values.push(null);
        }
        
        if (nasdaqValue && nasdaqStartValue) {
            const normalizedNasdaq = (nasdaqValue / nasdaqStartValue) * 100;
            nasdaqData.push(normalizedNasdaq);
            nasdaqValues.push(nasdaqValue);
        } else {
            nasdaqData.push(null);
            nasdaqValues.push(null);
        }
    });
    
    return { 
        sp500: sp500Data, 
        nasdaq: nasdaqData,
        sp500Values: sp500Values,
        nasdaqValues: nasdaqValues
    };
}

// New optimized function to generate benchmark data from cached data by date
function generateOptimizedBenchmarkData(labels, portfolioData) {
    const sp500Data = [];
    const nasdaqData = [];
    const sp500Values = [];
    const nasdaqValues = [];
    
    // Get cached benchmark data by date
    const cachedBenchmarkData = getCachedBenchmarkDataByDate();
    
    // Find the starting values for normalization
    let sp500StartValue = null;
    let nasdaqStartValue = null;
    
    // Find the first available benchmark data
    for (const label of labels) {
        const dateData = cachedBenchmarkData[label];
        if (dateData && dateData.sp500 && sp500StartValue === null) {
            sp500StartValue = dateData.sp500;
        }
        if (dateData && dateData.nasdaq && nasdaqStartValue === null) {
            nasdaqStartValue = dateData.nasdaq;
        }
        if (sp500StartValue && nasdaqStartValue) break;
    }
    
    // Generate normalized benchmark data
    labels.forEach((label, index) => {
        const dateData = cachedBenchmarkData[label];
        
        if (dateData && dateData.sp500 && sp500StartValue) {
            const normalizedSp500 = (dateData.sp500 / sp500StartValue) * 100;
            sp500Data.push(normalizedSp500);
            sp500Values.push(dateData.sp500);
        } else {
            sp500Data.push(null);
            sp500Values.push(null);
        }
        
        if (dateData && dateData.nasdaq && nasdaqStartValue) {
            const normalizedNasdaq = (dateData.nasdaq / nasdaqStartValue) * 100;
            nasdaqData.push(normalizedNasdaq);
            nasdaqValues.push(dateData.nasdaq);
        } else {
            nasdaqData.push(null);
            nasdaqValues.push(null);
        }
    });
    
    return { 
        sp500: sp500Data, 
        nasdaq: nasdaqData,
        sp500Values: sp500Values,
        nasdaqValues: nasdaqValues
    };
}

function generateBenchmarkComparisonData(dataLength) {
    // This is a simplified benchmark data generator
    // In a real implementation, you'd fetch actual historical benchmark data
    const sp500Data = [];
    const nasdaqData = [];
    
    // Generate realistic benchmark performance data
    let sp500Value = 100;
    let nasdaqValue = 100;
    
    for (let i = 0; i < dataLength; i++) {
        // Add some realistic market volatility
        const sp500Change = (Math.random() - 0.5) * 0.02; // ±1% daily change
        const nasdaqChange = (Math.random() - 0.5) * 0.025; // ±1.25% daily change (more volatile)
        
        sp500Value *= (1 + sp500Change);
        nasdaqValue *= (1 + nasdaqValue);
        
        sp500Data.push(sp500Value);
        nasdaqData.push(nasdaqValue);
    }
    
    return { sp500: sp500Data, nasdaq: nasdaqData };
}

function initializeCorrelationMatrixChart() {
    const ctx = document.getElementById('correlation-matrix-chart');
    if (!ctx) return;
    
    const correlationData = calculateAssetCorrelations();
    if (!correlationData || correlationData.labels.length === 0) {
        // Show a message when no correlation data is available
        ctx.parentElement.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
                <div class="text-center">
                    <div class="text-lg mb-2">📊</div>
                    <div class="text-sm">Correlation matrix requires</div>
                    <div class="text-sm">multiple data points with varying values</div>
                    <div class="text-xs mt-2 text-gray-500">Add more portfolio history entries to see correlations</div>
                </div>
            </div>
        `;
        return;
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: correlationData.labels,
            datasets: [{
                label: 'Correlation',
                data: correlationData.values,
                backgroundColor: correlationData.values.map(value => {
                    if (value > 0.3) return 'rgba(16, 185, 129, 0.8)'; // Green for positive
                    if (value < -0.3) return 'rgba(239, 68, 68, 0.8)'; // Red for negative
                    return 'rgba(107, 114, 128, 0.8)'; // Gray for neutral
                }),
                borderColor: correlationData.values.map(value => {
                    if (value > 0.3) return 'rgba(16, 185, 129, 1)';
                    if (value < -0.3) return 'rgba(239, 68, 68, 1)';
                    return 'rgba(107, 114, 128, 1)';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const strength = Math.abs(value) > 0.7 ? 'Strong' : 
                                           Math.abs(value) > 0.3 ? 'Moderate' : 'Weak';
                            const direction = value > 0 ? 'positive' : 'negative';
                            return `${context.label}: ${value.toFixed(3)} (${strength} ${direction})`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: -1,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Correlation Coefficient',
                        color: '#9ca3af',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function calculateAssetCorrelations() {
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length < 3) {
        console.log('Not enough history data for correlations:', validatedHistory.length);
        return null; // Need at least 3 data points
    }
    
    // Get asset categories from history
    const categories = ['stocks', 'etfs', 'crypto', 'static', 'cs2'];
    const categoryData = {};
    
    // Extract data for each category
    categories.forEach(category => {
        categoryData[category] = validatedHistory.map(entry => entry[category] || 0);
    });
    
    // Calculate correlations between categories
    const correlations = [];
    const labels = [];
    
    const categoryNames = {
        'stocks': 'Stocks',
        'etfs': 'ETFs', 
        'crypto': 'Crypto',
        'static': 'Cash & Savings',
        'cs2': 'CS2 Items'
    };
    
    // Calculate correlation between each pair
    for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
            const cat1 = categories[i];
            const cat2 = categories[j];
            
            // Only include if both categories have meaningful data
            const data1 = categoryData[cat1];
            const data2 = categoryData[cat2];
            
            // Check if both categories have varying data (not all zeros or all same values)
            const hasVariation1 = data1.some(val => val > 0) && new Set(data1).size > 1;
            const hasVariation2 = data2.some(val => val > 0) && new Set(data2).size > 1;
            
            if (hasVariation1 && hasVariation2) {
                const correlation = calculateCorrelation(data1, data2);
                correlations.push(correlation);
                labels.push(`${categoryNames[cat1]} ↔ ${categoryNames[cat2]}`);
            }
        }
    }
    
    console.log('Correlation data:', { labels, correlations, historyLength: validatedHistory.length });
    
    return {
        labels: labels,
        values: correlations
    };
}

function calculateCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function initializePortfolioBreakdownChart() {
    const ctx = document.getElementById('portfolio-breakdown-chart');
    if (!ctx) return;
    
    const totalValue = calculateTotalValue();
    const breakdown = calculatePortfolioBreakdown();
    
    const labels = [];
    const data = [];
    const colors = [];
    
    Object.entries(breakdown).forEach(([category, value]) => {
        if (value > 0) {
            labels.push(category);
            data.push(value);
            colors.push(getCategoryColor(category));
        }
    });
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#1f2937',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
                            return `${label}: €${value.toLocaleString(undefined, {maximumFractionDigits:2})} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calculatePortfolioBreakdown() {
    const breakdown = {
        'Stocks': 0,
        'ETFs': 0,
        'Crypto': 0,
        'Savings': 0,
        'Emergency Fund': 0,
        'Cash': 0,
        'CS2 Items': 0
    };
    
    // Calculate stocks value
    portfolio.stocks.forEach(stock => {
        const price = priceCache.stocks[stock.name] || 0;
        let value = price * stock.quantity;
        if (stock.currency === 'USD') value = value / eurUsdRate;
        breakdown['Stocks'] += value;
    });
    
    // Calculate ETFs value
    portfolio.etfs.forEach(etf => {
        const price = priceCache.stocks[etf.name] || 0;
        let value = price * etf.quantity;
        if (etf.currency === 'USD') value = value / eurUsdRate;
        breakdown['ETFs'] += value;
    });
    
    // Calculate crypto value
    portfolio.crypto.forEach(crypto => {
        const price = priceCache.crypto[crypto.name] || 0;
        let value = price * crypto.quantity;
        if (crypto.currency === 'USD') value = value / eurUsdRate;
        breakdown['Crypto'] += value;
    });
    
    // Calculate static assets value
    portfolio.static.forEach(asset => {
        if (asset.values && asset.values.length > 0) {
            const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            let value = latest.value;
            if (latest.currency === 'USD') value = value / eurUsdRate;
            breakdown[asset.type] = (breakdown[asset.type] || 0) + value;
        }
    });
    
    // Add CS2 value (now handles dynamic portfolios)
    if (portfolio.cs2) {
        let cs2Value = 0;
        
        // If we have the combined total in EUR (new structure)
        if (typeof portfolio.cs2.value === 'number' && portfolio.cs2.currency === 'EUR') {
            cs2Value = portfolio.cs2.value;
        }
        // If we have dynamic portfolios structure
        else if (portfolio.cs2.portfolios) {
            const totalUsd = Object.values(portfolio.cs2.portfolios)
                .reduce((sum, p) => sum + (p.value || 0), 0);
            cs2Value = totalUsd / eurUsdRate;
        }
        // Legacy structure (playItems + investmentItems)
        else {
            const playItemsValue = portfolio.cs2.playItems?.value || 0;
            const investmentItemsValue = portfolio.cs2.investmentItems?.value || 0;
            const totalUsd = playItemsValue + investmentItemsValue;
            cs2Value = totalUsd / eurUsdRate;
        }
        
        breakdown['CS2 Items'] += cs2Value;
    }
    
    return breakdown;
}

function getCategoryColor(category) {
    const colors = {
        'Stocks': '#3b82f6',
        'ETFs': '#6366f1',
        'Crypto': '#f59e0b',
        'Savings': '#10b981',
        'Emergency Fund': '#34d399',
        'Cash': '#059669',
        'CS2 Items': '#f43f5e'
    };
    return colors[category] || '#6b7280';
}

function calculateBestPerformer() {
    let bestAsset = null;
    let bestPercentage = -Infinity;
    
    // Check stocks
    portfolio.stocks.forEach(stock => {
        const currentPrice = priceCache.stocks[stock.name] || 0;
        if (currentPrice > 0 && stock.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
            if (pnlPercentage > bestPercentage) {
                bestPercentage = pnlPercentage;
                bestAsset = {
                    name: stock.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    // Check ETFs
    portfolio.etfs.forEach(etf => {
        const currentPrice = priceCache.stocks[etf.name] || 0;
        if (currentPrice > 0 && etf.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - etf.purchasePrice) / etf.purchasePrice) * 100;
            if (pnlPercentage > bestPercentage) {
                bestPercentage = pnlPercentage;
                bestAsset = {
                    name: etf.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    // Check crypto
    portfolio.crypto.forEach(crypto => {
        const currentPrice = priceCache.crypto[crypto.name] || 0;
        if (currentPrice > 0 && crypto.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - crypto.purchasePrice) / crypto.purchasePrice) * 100;
            if (pnlPercentage > bestPercentage) {
                bestPercentage = pnlPercentage;
                bestAsset = {
                    name: crypto.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    return bestAsset;
}

function calculateWorstPerformer() {
    let worstAsset = null;
    let worstPercentage = Infinity;
    
    // Check stocks
    portfolio.stocks.forEach(stock => {
        const currentPrice = priceCache.stocks[stock.name] || 0;
        if (currentPrice > 0 && stock.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
            if (pnlPercentage < worstPercentage) {
                worstPercentage = pnlPercentage;
                worstAsset = {
                    name: stock.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    // Check ETFs
    portfolio.etfs.forEach(etf => {
        const currentPrice = priceCache.stocks[etf.name] || 0;
        if (currentPrice > 0 && etf.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - etf.purchasePrice) / etf.purchasePrice) * 100;
            if (pnlPercentage < worstPercentage) {
                worstPercentage = pnlPercentage;
                worstAsset = {
                    name: etf.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    // Check crypto
    portfolio.crypto.forEach(crypto => {
        const currentPrice = priceCache.crypto[crypto.name] || 0;
        if (currentPrice > 0 && crypto.purchasePrice > 0) {
            const pnlPercentage = ((currentPrice - crypto.purchasePrice) / crypto.purchasePrice) * 100;
            if (pnlPercentage < worstPercentage) {
                worstPercentage = pnlPercentage;
                worstAsset = {
                    name: crypto.name,
                    percentage: (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%'
                };
            }
        }
    });
    
    return worstAsset;
}

function calculateTotalPnL() {
    let totalPnL = 0;
    
    // Calculate stocks P&L
    portfolio.stocks.forEach(stock => {
        const currentPrice = priceCache.stocks[stock.name] || 0;
        if (currentPrice > 0 && stock.purchasePrice > 0) {
            const currentValue = currentPrice * stock.quantity;
            const purchaseValue = stock.purchasePrice * stock.quantity;
            let pnl = currentValue - purchaseValue;
            
            // Convert to EUR if needed
            if (stock.currency === 'USD') {
                pnl = pnl / eurUsdRate;
            }
            totalPnL += pnl;
        }
    });
    
    // Calculate ETFs P&L
    portfolio.etfs.forEach(etf => {
        const currentPrice = priceCache.stocks[etf.name] || 0;
        if (currentPrice > 0 && etf.purchasePrice > 0) {
            const currentValue = currentPrice * etf.quantity;
            const purchaseValue = etf.purchasePrice * etf.quantity;
            let pnl = currentValue - purchaseValue;
            
            // Convert to EUR if needed
            if (etf.currency === 'USD') {
                pnl = pnl / eurUsdRate;
            }
            totalPnL += pnl;
        }
    });
    
    // Calculate crypto P&L
    portfolio.crypto.forEach(crypto => {
        const currentPrice = priceCache.crypto[crypto.name] || 0;
        if (currentPrice > 0 && crypto.purchasePrice > 0) {
            const currentValue = currentPrice * crypto.quantity;
            const purchaseValue = crypto.purchasePrice * crypto.quantity;
            let pnl = currentValue - purchaseValue;
            
            // Convert to EUR if needed
            if (crypto.currency === 'USD') {
                pnl = pnl / eurUsdRate;
            }
            totalPnL += pnl;
        }
    });
    
    // Static assets and CS2 don't have P&L (they're cash-like)
    
    return totalPnL;
}

function calculateTotalPnLPercentage() {
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    
    // Calculate stocks
    portfolio.stocks.forEach(stock => {
        const currentPrice = priceCache.stocks[stock.name] || 0;
        if (currentPrice > 0 && stock.purchasePrice > 0) {
            const currentValue = currentPrice * stock.quantity;
            const purchaseValue = stock.purchasePrice * stock.quantity;
            
            // Convert to EUR if needed
            if (stock.currency === 'USD') {
                totalCurrentValue += currentValue / eurUsdRate;
                totalPurchaseValue += purchaseValue / eurUsdRate;
            } else {
                totalCurrentValue += currentValue;
                totalPurchaseValue += purchaseValue;
            }
        }
    });
    
    // Calculate ETFs
    portfolio.etfs.forEach(etf => {
        const currentPrice = priceCache.stocks[etf.name] || 0;
        if (currentPrice > 0 && etf.purchasePrice > 0) {
            const currentValue = currentPrice * etf.quantity;
            const purchaseValue = etf.purchasePrice * etf.quantity;
            
            // Convert to EUR if needed
            if (etf.currency === 'USD') {
                totalCurrentValue += currentValue / eurUsdRate;
                totalPurchaseValue += purchaseValue / eurUsdRate;
            } else {
                totalCurrentValue += currentValue;
                totalPurchaseValue += purchaseValue;
            }
        }
    });
    
    // Calculate crypto
    portfolio.crypto.forEach(crypto => {
        const currentPrice = priceCache.crypto[crypto.name] || 0;
        if (currentPrice > 0 && crypto.purchasePrice > 0) {
            const currentValue = currentPrice * crypto.quantity;
            const purchaseValue = crypto.purchasePrice * crypto.quantity;
            
            // Convert to EUR if needed
            if (crypto.currency === 'USD') {
                totalCurrentValue += currentValue / eurUsdRate;
                totalPurchaseValue += purchaseValue / eurUsdRate;
            } else {
                totalCurrentValue += currentValue;
                totalPurchaseValue += purchaseValue;
            }
        }
    });
    
    if (totalPurchaseValue === 0) return 0;
    return ((totalCurrentValue - totalPurchaseValue) / totalPurchaseValue) * 100;
}

function updateAutoUpdatesStatus() {
    const updateStatuses = getUpdateStatuses();
    const autoUpdatesElement = document.querySelector('.text-emerald-400');
    
    if (autoUpdatesElement && updateStatuses) {
        const assetTypes = ['rates', 'stocks', 'etfs', 'crypto'];
        const statusTexts = [];
        
        assetTypes.forEach(type => {
            const status = updateStatuses[type];
            if (status && status.status === 'error') {
                statusTexts.push(`<span class="text-red-400">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`);
            } else {
                statusTexts.push(`<span class="text-emerald-400">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`);
            }
        });
        
        autoUpdatesElement.innerHTML = statusTexts.join(', ');
    }
}

// Export function for use in shared.js
window.updateAutoUpdatesStatus = updateAutoUpdatesStatus;

function updateDashboardStats() {
    const totalValue = calculateTotalValue();
    const breakdown = calculatePortfolioBreakdown();
    
    // Update total value
    const totalValueEl = document.getElementById('dashboard-total-value');
    if (totalValueEl) {
        totalValueEl.textContent = formatCurrency(totalValue);
    }
    
    // Update total P&L (real calculation)
    const totalPnlEl = document.getElementById('dashboard-total-pnl');
    const pnlPercentageEl = document.getElementById('dashboard-pnl-percentage');
    if (totalPnlEl && pnlPercentageEl) {
        const totalPnl = calculateTotalPnL();
        const pnlPercentage = calculateTotalPnLPercentage();
        totalPnlEl.textContent = formatCurrency(totalPnl);
        pnlPercentageEl.textContent = (pnlPercentage >= 0 ? '+' : '') + pnlPercentage.toFixed(2) + '%';
    }
    
    // Update asset count
    const assetCountEl = document.getElementById('dashboard-asset-count');
    if (assetCountEl) {
        const assetCount = portfolio.stocks.length + portfolio.etfs.length + portfolio.crypto.length + portfolio.static.length;
        assetCountEl.textContent = assetCount;
    }
    
    // Update best performer
    const bestPerformerEl = document.getElementById('dashboard-best-performer');
    const bestPercentageEl = document.getElementById('dashboard-best-percentage');
    if (bestPerformerEl && bestPercentageEl) {
        const bestPerformer = calculateBestPerformer();
        if (bestPerformer) {
            bestPerformerEl.textContent = bestPerformer.name;
            bestPercentageEl.textContent = bestPerformer.percentage;
        } else {
            bestPerformerEl.textContent = '-';
            bestPercentageEl.textContent = '+0.00%';
        }
    }
    
    // Update worst performer
    const worstPerformerEl = document.getElementById('dashboard-worst-performer');
    const worstPercentageEl = document.getElementById('dashboard-worst-percentage');
    if (worstPerformerEl && worstPercentageEl) {
        const worstPerformer = calculateWorstPerformer();
        if (worstPerformer) {
            worstPerformerEl.textContent = worstPerformer.name;
            worstPercentageEl.textContent = worstPerformer.percentage;
        } else {
            worstPerformerEl.textContent = '-';
            worstPercentageEl.textContent = '+0.00%';
        }
    }
    
    // Update benchmark performance
    updateBenchmarkPerformance();
    
    // Update daily return metrics
    updateDailyReturnMetrics();
    
    // Update total value bar
    updateTotalValueBar(totalValue);
}

function updateBenchmarkPerformance() {
    const validatedHistory = loadValidatedHistory();
    // Don't return early - we want to show benchmark values even without history
    
    const portfolioData = validatedHistory.map(entry => entry.eur || 0);
    const portfolioIndex = normalizeToIndex(portfolioData);
    
    // Calculate portfolio performance (only if we have data)
    const portfolioPerformance = portfolioIndex.length > 0 ? portfolioIndex[portfolioIndex.length - 1] - 100 : 0;
    
    // Get real benchmark data
    const cachedBenchmark = getCachedBenchmarkData();
    if (cachedBenchmark && cachedBenchmark.sp500 && cachedBenchmark.nasdaq) {
        // Show current benchmark values
        const sp500Value = cachedBenchmark.sp500;
        const nasdaqValue = cachedBenchmark.nasdaq;
        
        // Update S&P 500 card with current value
        const sp500PerfEl = document.getElementById('sp500-performance');
        const sp500DiffEl = document.getElementById('sp500-difference');
        if (sp500PerfEl && sp500DiffEl) {
            sp500PerfEl.textContent = sp500Value.toLocaleString();
            sp500DiffEl.textContent = `Current S&P 500 Value`;
            sp500PerfEl.className = 'text-2xl font-bold text-blue-400';
        }
        
        // Update NASDAQ card with current value
        const nasdaqPerfEl = document.getElementById('nasdaq-performance');
        const nasdaqDiffEl = document.getElementById('nasdaq-difference');
        if (nasdaqPerfEl && nasdaqDiffEl) {
            nasdaqPerfEl.textContent = nasdaqValue.toLocaleString();
            nasdaqDiffEl.textContent = `Current NASDAQ Value`;
            nasdaqPerfEl.className = 'text-2xl font-bold text-blue-400';
        }
    } else {
        // Fallback to generated data if no real data available
        const benchmarkData = generateBenchmarkComparisonData(portfolioData.length);
        const sp500Performance = benchmarkData.sp500[benchmarkData.sp500.length - 1] - 100;
        const nasdaqPerformance = benchmarkData.nasdaq[benchmarkData.nasdaq.length - 1] - 100;
        
        // Calculate differences
        const sp500Difference = portfolioPerformance - sp500Performance;
        const nasdaqDifference = portfolioPerformance - nasdaqPerformance;
        
        // Update S&P 500 card
        const sp500PerfEl = document.getElementById('sp500-performance');
        const sp500DiffEl = document.getElementById('sp500-difference');
        if (sp500PerfEl && sp500DiffEl) {
            sp500PerfEl.textContent = (portfolioPerformance >= 0 ? '+' : '') + portfolioPerformance.toFixed(1) + '%';
            sp500DiffEl.textContent = `vs S&P 500: ${sp500Difference >= 0 ? '+' : ''}${sp500Difference.toFixed(1)}%`;
            sp500PerfEl.className = sp500Difference >= 0 ? 'text-2xl font-bold text-emerald-400' : 'text-2xl font-bold text-red-400';
        }
        
        // Update NASDAQ card
        const nasdaqPerfEl = document.getElementById('nasdaq-performance');
        const nasdaqDiffEl = document.getElementById('nasdaq-difference');
        if (nasdaqPerfEl && nasdaqDiffEl) {
            nasdaqPerfEl.textContent = (portfolioPerformance >= 0 ? '+' : '') + portfolioPerformance.toFixed(1) + '%';
            nasdaqDiffEl.textContent = `vs NASDAQ: ${nasdaqDifference >= 0 ? '+' : ''}${nasdaqDifference.toFixed(1)}%`;
            nasdaqPerfEl.className = nasdaqDifference >= 0 ? 'text-2xl font-bold text-emerald-400' : 'text-2xl font-bold text-red-400';
        }
    }
}

function updateDailyReturnMetrics() {
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length < 2) return;
    
    const portfolioData = validatedHistory.map(entry => entry.eur || 0);
    const dailyReturns = calculateDailyReturns(portfolioData);
    
    if (dailyReturns.length === 0) return;
    
    // Calculate average daily return
    const avgDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    
    // Find best and worst days
    const bestDayIndex = dailyReturns.indexOf(Math.max(...dailyReturns));
    const worstDayIndex = dailyReturns.indexOf(Math.min(...dailyReturns));
    
    const bestDayReturn = dailyReturns[bestDayIndex];
    const worstDayReturn = dailyReturns[worstDayIndex];
    
    // Get dates (skip first entry as it has no previous day to compare)
    const dates = validatedHistory.map(entry => entry.date).slice(1);
    const bestDayDate = dates[bestDayIndex];
    const worstDayDate = dates[worstDayIndex];
    
    // Update average daily return card
    const avgReturnEl = document.getElementById('avg-daily-return');
    const periodEl = document.getElementById('daily-return-period');
    if (avgReturnEl && periodEl) {
        avgReturnEl.textContent = (avgDailyReturn >= 0 ? '+' : '') + avgDailyReturn.toFixed(2) + '%';
        avgReturnEl.className = avgDailyReturn >= 0 ? 'text-2xl font-bold text-emerald-400' : 'text-2xl font-bold text-red-400';
        periodEl.textContent = `Over ${dailyReturns.length} days`;
    }
    
    // Update best day card
    const bestReturnEl = document.getElementById('best-day-return');
    const bestDateEl = document.getElementById('best-day-date');
    if (bestReturnEl && bestDateEl) {
        bestReturnEl.textContent = (bestDayReturn >= 0 ? '+' : '') + bestDayReturn.toFixed(2) + '%';
        bestDateEl.textContent = bestDayDate || '--';
    }
    
    // Update worst day card
    const worstReturnEl = document.getElementById('worst-day-return');
    const worstDateEl = document.getElementById('worst-day-date');
    if (worstReturnEl && worstDateEl) {
        worstReturnEl.textContent = (worstDayReturn >= 0 ? '+' : '') + worstDayReturn.toFixed(2) + '%';
        worstDateEl.textContent = worstDayDate || '--';
    }
}

function calculateDailyReturns(values) {
    const returns = [];
    for (let i = 1; i < values.length; i++) {
        if (values[i-1] > 0) {
            const dailyReturn = ((values[i] - values[i-1]) / values[i-1]) * 100;
            returns.push(dailyReturn);
        }
    }
    return returns;
}

function loadMonthlyPerformance() {
    const monthlyList = document.getElementById('monthly-performance-list');
    const monthlyPeriod = document.getElementById('monthly-performance-period');
    if (!monthlyList) return;
    
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length === 0) {
        monthlyList.innerHTML = '<div class="text-gray-400 text-center py-4">No data available</div>';
        if (monthlyPeriod) monthlyPeriod.textContent = 'No data';
        return;
    }
    
    const monthlyData = calculateMonthlyPerformance(validatedHistory);
    
    if (monthlyData.length === 0) {
        monthlyList.innerHTML = '<div class="text-gray-400 text-center py-4">No monthly data available</div>';
        if (monthlyPeriod) monthlyPeriod.textContent = 'No data';
        return;
    }
    
    let html = '';
    monthlyData.slice(-6).forEach(month => {
        const performanceClass = month.performance >= 0 ? 'text-emerald-400' : 'text-red-400';
        const performanceSign = month.performance >= 0 ? '+' : '';
        
        html += `
            <div class="flex justify-between items-center p-1 bg-gray-700 rounded text-xs">
                <div>
                    <div class="font-medium">${month.month}</div>
                    <div class="text-gray-400">${performanceSign}${month.performance.toFixed(1)}%</div>
                </div>
                <div class="text-right text-gray-400">
                    ${month.days}d
                </div>
            </div>
        `;
    });
    
    monthlyList.innerHTML = html;
    
    // Set period information with initial value
    if (monthlyPeriod && monthlyData.length > 0) {
        const firstMonth = monthlyData[0];
        const lastMonth = monthlyData[monthlyData.length - 1];
        monthlyPeriod.textContent = `${firstMonth.month} - ${lastMonth.month} (Start: €${firstMonth.startValue.toLocaleString()})`;
    }
}

function loadYearlyPerformance() {
    const yearlyList = document.getElementById('yearly-performance-list');
    const yearlyPeriod = document.getElementById('yearly-performance-period');
    if (!yearlyList) return;
    
    const validatedHistory = loadValidatedHistory();
    if (validatedHistory.length === 0) {
        yearlyList.innerHTML = '<div class="text-gray-400 text-center py-4">No data available</div>';
        if (yearlyPeriod) yearlyPeriod.textContent = 'No data';
        return;
    }
    
    const yearlyData = calculateYearlyPerformance(validatedHistory);
    
    if (yearlyData.length === 0) {
        yearlyList.innerHTML = '<div class="text-gray-400 text-center py-4">No yearly data available</div>';
        if (yearlyPeriod) yearlyPeriod.textContent = 'No data';
        return;
    }
    
    let html = '';
    yearlyData.forEach(year => {
        const performanceClass = year.performance >= 0 ? 'text-emerald-400' : 'text-red-400';
        const performanceSign = year.performance >= 0 ? '+' : '';
        
        html += `
            <div class="flex justify-between items-center p-1 bg-gray-700 rounded text-xs">
                <div>
                    <div class="font-medium">${year.year}</div>
                    <div class="text-gray-400">${performanceSign}${year.performance.toFixed(1)}%</div>
                </div>
                <div class="text-right text-gray-400">
                    ${year.entries}e
                </div>
            </div>
        `;
    });
    
    yearlyList.innerHTML = html;
    
    // Set period information with initial value
    if (yearlyPeriod && yearlyData.length > 0) {
        const firstYear = yearlyData[0];
        const lastYear = yearlyData[yearlyData.length - 1];
        yearlyPeriod.textContent = `${firstYear.year} - ${lastYear.year} (Start: €${firstYear.startValue.toLocaleString()})`;
    }
}

function calculateMonthlyPerformance(history) {
    const monthlyData = {};
    
    history.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthName,
                entries: [],
                startValue: entry.eur || 0,
                endValue: entry.eur || 0,
                days: 0
            };
        }
        
        monthlyData[monthKey].entries.push(entry);
        monthlyData[monthKey].endValue = entry.eur || 0;
        monthlyData[monthKey].days++;
    });
    
    // Calculate performance for each month
    return Object.values(monthlyData).map(month => {
        const performance = month.startValue > 0 ? 
            ((month.endValue - month.startValue) / month.startValue) * 100 : 0;
        
        return {
            ...month,
            performance
        };
    }).sort((a, b) => a.month.localeCompare(b.month));
}

function calculateYearlyPerformance(history) {
    const yearlyData = {};
    
    history.forEach(entry => {
        const date = new Date(entry.date);
        const year = date.getFullYear().toString();
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                year,
                entries: [],
                startValue: entry.eur || 0,
                endValue: entry.eur || 0
            };
        }
        
        yearlyData[year].entries.push(entry);
        yearlyData[year].endValue = entry.eur || 0;
    });
    
    // Calculate performance for each year
    return Object.values(yearlyData).map(year => {
        const performance = year.startValue > 0 ? 
            ((year.endValue - year.startValue) / year.startValue) * 100 : 0;
        
        return {
            ...year,
            performance,
            entries: year.entries.length
        };
    }).sort((a, b) => a.year.localeCompare(b.year));
}

function loadRecentActivity() {
    const recentActivityList = document.getElementById('recent-activity-list');
    if (!recentActivityList) return;
    
    const transactions = loadTransactions();
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentActivityList.innerHTML = '<div class="text-gray-400">No recent activity.</div>';
        return;
    }
    
    let html = '';
    recentTransactions.forEach(tx => {
        const typeColor = tx.type === 'deposit' ? 'text-green-400' : 'text-red-400';
        const typeIcon = tx.type === 'deposit' ? '↗' : '↘';
        html += `
            <div class="flex justify-between items-center p-2 bg-gray-700 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${typeIcon}</span>
                    <span class="text-sm">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} - ${tx.assetType}</span>
                </div>
                <div class="text-right">
                    <div class="${typeColor} font-semibold">${formatCurrency(tx.amount, 'EUR')}</div>
                    <div class="text-xs text-gray-400">${tx.date}</div>
                </div>
            </div>
        `;
    });
    
    recentActivityList.innerHTML = html;
}


async function addToHistory() {
    const totalValue = calculateTotalValue();
    const breakdown = calculatePortfolioBreakdown();
    
    // Use the same logic as updateTotalValueBar for currency conversions
    const cached = getCachedCryptoRates();
    let btcValue = 0;
    let ethValue = 0;
    
    if (cached && cached.btc && cached.eth) {
        btcValue = totalValue / cached.btc; // Same as updateTotalValueBar
        ethValue = totalValue / cached.eth; // Same as updateTotalValueBar
    }
    
    const today = new Date().toISOString().slice(0, 10);
    
    // Fetch and cache benchmark data for today's date
    try {
        showNotification('Fetching benchmark data...', 'info');
        
        // Check if we already have cached benchmark data for today
        const cachedBenchmarkData = getCachedBenchmarkDataForDate(today);
        
        if (!cachedBenchmarkData) {
            // Fetch benchmark data for today
            const benchmarkData = await fetchBenchmarkDataForDate(today);
            if (benchmarkData) {
                setCachedBenchmarkDataForDate(today, benchmarkData.sp500, benchmarkData.nasdaq);
                console.log('Benchmark data cached for', today);
            } else {
                console.warn('Failed to fetch benchmark data for', today);
            }
        } else {
            console.log('Using cached benchmark data for', today);
        }
    } catch (error) {
        console.error('Error fetching benchmark data:', error);
        // Continue with adding to history even if benchmark fetch fails
    }
    
    const historyEntry = {
        date: today,
        total: totalValue,
        eur: totalValue,
        usd: totalValue * eurUsdRate,
        stocks: breakdown['Stocks'] || 0,
        etfs: breakdown['ETFs'] || 0,
        crypto: breakdown['Crypto'] || 0,
        static: (breakdown['Savings'] || 0) + (breakdown['Emergency Fund'] || 0) + (breakdown['Cash'] || 0),
        cs2: breakdown['CS2 Items'] || 0,
        savings: breakdown['Savings'] || 0,
        emergency: breakdown['Emergency Fund'] || 0,
        cash: breakdown['Cash'] || 0,
        btc: btcValue,
        eth: ethValue
    };
    
    const validatedHistory = loadValidatedHistory();
    
    // Check if an entry for today already exists
    const existingIndex = validatedHistory.findIndex(entry => entry.date === today);
    
    if (existingIndex !== -1) {
        // Replace existing entry for today
        validatedHistory[existingIndex] = historyEntry;
        showNotification('Portfolio value updated for today!', 'success');
    } else {
        // Add new entry for new day
        validatedHistory.push(historyEntry);
        showNotification('Portfolio value added to history!', 'success');
    }
    
    saveValidatedHistory(validatedHistory);
    
    // Refresh charts
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// --- RETIREMENT TRACKING ---
function initializeRetirementChart() {
    const ctx = document.getElementById('retirement-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.retirementChart) {
        window.retirementChart.destroy();
    }
    
    const validatedHistory = loadValidatedHistory();
    const transactions = loadTransactions();
    
    // Calculate retirement progress data
    const retirementData = calculateRetirementProgress(validatedHistory, transactions);
    
    window.retirementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: retirementData.labels,
            datasets: [
                {
                    label: 'Total Portfolio Value',
                    data: retirementData.portfolioValues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'Total Contributions',
                    data: retirementData.contributionValues,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 1,
                    pointHoverRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#d1d5db'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#d1d5db',
                    borderColor: '#4b5563',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            const index = context.dataIndex;
                            
                            if (datasetLabel === 'Total Portfolio Value') {
                                const contributionValue = retirementData.contributionValues[index];
                                const compoundInterest = value - contributionValue;
                                return [
                                    `${datasetLabel}: €${value.toLocaleString()}`,
                                    `Contributions: €${contributionValue.toLocaleString()}`,
                                    `Compound Interest: €${compoundInterest.toLocaleString()}`
                                ];
                            } else if (datasetLabel === 'Total Contributions') {
                                return `${datasetLabel}: €${value.toLocaleString()}`;
                            }
                            return `${datasetLabel}: €${value.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                y: {
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return '€' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: '#374151'
                    }
                }
            }
        }
    });
}

function setupRetirementControls() {
    const amountInput = document.getElementById('monthly-allocation-amount');
    const returnRateInput = document.getElementById('annual-return-rate');
    const descriptionElement = document.querySelector('#retirement-chart').closest('.bg-gray-800').querySelector('.text-sm.text-gray-400.mb-4');
    
    if (!amountInput || !returnRateInput) return;
    
    // Update chart when amount changes
    amountInput.addEventListener('input', function() {
        updateRetirementDescription();
        initializeRetirementChart();
    });
    
    // Update chart when return rate changes
    returnRateInput.addEventListener('input', function() {
        updateRetirementDescription();
        initializeRetirementChart();
    });
    
    // Update description based on current settings
    function updateRetirementDescription() {
        if (descriptionElement) {
            const returnRate = returnRateInput.value || 10;
            descriptionElement.textContent = `Projected growth until 2065 assuming ${returnRate}% annual returns`;
        }
    }
    
    // Initial description update
    updateRetirementDescription();
}

function calculateRetirementProgress(history, transactions) {
    const labels = [];
    const portfolioValues = [];
    const contributionValues = [];
    
    // Get monthly allocation settings
    const monthlyAmount = parseFloat(document.getElementById('monthly-allocation-amount')?.value) || 0;
    const annualReturnRate = parseFloat(document.getElementById('annual-return-rate')?.value) || 10;
    
    // Generate data points from now until 2065
    const startDate = new Date();
    const endDate = new Date(2065, 11, 31); // December 31, 2065
    const currentValue = history.length > 0 ? history[history.length - 1].eur : 0;
    const annualGrowthRate = annualReturnRate / 100; // Convert percentage to decimal
    const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1/12) - 1; // Monthly growth rate
    
    // Calculate total months from start to end
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
    
    let runningValue = currentValue;
    let totalContributions = 0;
    
    for (let i = 0; i <= totalMonths; i += 6) { // Every 6 months
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        // Stop if we've reached 2065
        if (date.getFullYear() > 2065) break;
        
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        
        // Calculate value for this point
        if (monthlyAmount > 0) {
            // Apply monthly contributions and growth for the 6-month period
            for (let month = 0; month < 6; month++) {
                // Add monthly contribution
                runningValue += monthlyAmount;
                totalContributions += monthlyAmount;
                // Apply monthly growth
                runningValue *= (1 + monthlyGrowthRate);
            }
        } else {
            // Simple annual growth projection (no monthly contributions)
            const yearsElapsed = i / 12;
            runningValue = currentValue * Math.pow(1 + annualGrowthRate, yearsElapsed);
            totalContributions = 0; // No new contributions
        }
        
        portfolioValues.push(runningValue);
        contributionValues.push(totalContributions);
    }
    
    return { labels, portfolioValues, contributionValues };
}

// --- CASH FLOW SUMMARY ---
function updateCashFlowSummary() {
    const transactions = loadTransactions();
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'deposit') {
            totalDeposits += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
            totalWithdrawals += transaction.amount;
        }
    });
    
    const netCashFlow = totalDeposits - totalWithdrawals;
    
    // Update DOM elements
    const totalDepositsEl = document.getElementById('total-deposits');
    const totalWithdrawalsEl = document.getElementById('total-withdrawals');
    const netCashFlowEl = document.getElementById('net-cash-flow');
    
    if (totalDepositsEl) {
        totalDepositsEl.textContent = formatCurrency(totalDeposits, 'EUR');
    }
    if (totalWithdrawalsEl) {
        totalWithdrawalsEl.textContent = formatCurrency(totalWithdrawals, 'EUR');
    }
    if (netCashFlowEl) {
        netCashFlowEl.textContent = formatCurrency(netCashFlow, 'EUR');
        // Color code based on positive/negative
        if (netCashFlow >= 0) {
            netCashFlowEl.className = 'text-2xl font-bold text-emerald-400';
        } else {
            netCashFlowEl.className = 'text-2xl font-bold text-red-400';
        }
    }
}
