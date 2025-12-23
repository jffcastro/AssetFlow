// Calculator Module
// Functions for financial calculations

/**
 * Calculates transaction totals by asset type.
 * @param {Array} transactions - Array of transactions
 * @returns {object} Totals by asset type
 */
export function getTransactionTotals(transactions) {
    const totals = {
        stocks: { deposit: 0, withdrawal: 0 },
        etfs: { deposit: 0, withdrawal: 0 },
        crypto: { deposit: 0, withdrawal: 0 }
    };
    transactions.forEach(tx => {
        if (!totals[tx.assetType]) return;
        if (tx.type === 'deposit') totals[tx.assetType].deposit += tx.amount;
        if (tx.type === 'withdrawal') totals[tx.assetType].withdrawal += tx.amount;
    });
    return totals;
}

/**
 * Calculates holding time for an asset.
 * @param {Array} transactions - Array of transactions
 * @param {string} assetType - Type of asset
 * @param {string} symbol - Asset symbol
 * @returns {object|null} Holding time object or null
 */
export function calculateHoldingTime(transactions, assetType, symbol) {
    const assetTxs = transactions.filter(tx =>
        tx.assetType === assetType && tx.symbol === symbol && tx.type === 'buy'
    );

    if (assetTxs.length === 0) return null;

    // Find earliest buy date
    const earliestBuy = assetTxs.reduce((earliest, tx) => {
        const txDate = new Date(tx.date);
        return txDate < earliest ? txDate : earliest;
    }, new Date(assetTxs[0].date));

    const now = new Date();
    const diffTime = Math.abs(now - earliestBuy);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const daysRemainder = diffDays % 30;

    return { years, months, daysRemainder, totalDays: diffDays };
}

/**
 * Calculates realized P&L using FIFO method.
 * @param {Array} transactions - Array of transactions
 * @param {object} portfolio - Portfolio object (for CS2 data)
 * @param {number} eurUsdRate - Current EUR/USD rate
 * @returns {object} Realized P&L by asset type
 */
export function calculateRealizedPnL(transactions, portfolio, eurUsdRate) {
    const realizedPnL = {
        stocks: 0,
        etfs: 0,
        crypto: 0,
        cs2: 0,
        total: 0,
        byAsset: {}
    };

    // Group transactions by asset type and symbol
    const assetGroups = {};

    transactions.forEach(tx => {
        if (tx.assetType === 'stocks' || tx.assetType === 'etfs' || tx.assetType === 'crypto') {
            const key = `${tx.assetType}_${tx.symbol}`;
            if (!assetGroups[key]) {
                assetGroups[key] = {
                    assetType: tx.assetType,
                    symbol: tx.symbol,
                    buys: [],
                    sells: []
                };
            }

            if (tx.type === 'buy') {
                assetGroups[key].buys.push({ ...tx });
            } else if (tx.type === 'sell') {
                assetGroups[key].sells.push({ ...tx });
            }
        }
    });

    // Calculate realized P&L for each asset using FIFO
    Object.values(assetGroups).forEach(asset => {
        let remainingBuys = [...asset.buys];
        let assetRealizedPnL = 0;

        // Sort buys by date (FIFO)
        remainingBuys.sort((a, b) => new Date(a.date) - new Date(b.date));

        asset.sells.forEach(sell => {
            let sellQuantity = sell.quantity;
            let sellTotalUSD = sell.originalPrice ? sell.originalPrice * sell.quantity : sell.total * eurUsdRate;
            let sellTotalEUR = sellTotalUSD / (sell.historicalRate || eurUsdRate);

            while (sellQuantity > 0 && remainingBuys.length > 0) {
                const buy = remainingBuys[0];
                const buyQuantity = buy.quantity;
                let buyTotalUSD = buy.originalPrice ? buy.originalPrice * buy.quantity : buy.total * eurUsdRate;
                let buyTotalEUR = buyTotalUSD / (buy.historicalRate || eurUsdRate);

                if (buyQuantity <= sellQuantity) {
                    const sellPortionEUR = (sellTotalEUR * buyQuantity) / sell.quantity;
                    const realizedGain = sellPortionEUR - buyTotalEUR;
                    realizedPnL[asset.assetType] += realizedGain;
                    assetRealizedPnL += realizedGain;
                    sellQuantity -= buyQuantity;
                    remainingBuys.shift();
                } else {
                    const sellPortionEUR = (sellTotalEUR * sellQuantity) / sell.quantity;
                    const buyPortionEUR = (buyTotalEUR * sellQuantity) / buyQuantity;
                    const realizedGain = sellPortionEUR - buyPortionEUR;
                    realizedPnL[asset.assetType] += realizedGain;
                    assetRealizedPnL += realizedGain;
                    remainingBuys[0].quantity -= sellQuantity;
                    remainingBuys[0].total -= buyPortionEUR;
                    sellQuantity = 0;
                }
            }
        });

        const assetKey = `${asset.assetType}-${asset.symbol}`;
        realizedPnL.byAsset[assetKey] = assetRealizedPnL;
    });

    // Add CS2 realized P&L from portfolios
    if (portfolio && portfolio.cs2 && portfolio.cs2.portfolios) {
        Object.values(portfolio.cs2.portfolios).forEach(portfolioData => {
            if (portfolioData.realizedPnl) {
                const eurValue = portfolioData.realizedPnl / eurUsdRate;
                realizedPnL.cs2 += eurValue;
            }
        });
    }

    realizedPnL.total = realizedPnL.stocks + realizedPnL.etfs + realizedPnL.crypto + realizedPnL.cs2;
    return realizedPnL;
}

/**
 * Calculates total portfolio value.
 * @param {object} portfolio - Portfolio object
 * @param {object} priceCache - Cached prices
 * @param {number} eurUsdRate - Current EUR/USD rate
 * @returns {number} Total value in EUR
 */
export function calculateTotalValue(portfolio, priceCache, eurUsdRate) {
    let totalValue = 0;

    // Calculate stocks value
    if (portfolio.stocks) {
        portfolio.stocks.forEach(stock => {
            const cachedData = (priceCache.stocks && priceCache.stocks[stock.name]) || {};
            const price = cachedData.price || 0;
            totalValue += price * stock.quantity;
        });
    }

    // Calculate ETFs value
    if (portfolio.etfs) {
        portfolio.etfs.forEach(etf => {
            const cachedData = (priceCache.etfs && priceCache.etfs[etf.name]) || {};
            const price = cachedData.price || 0;
            totalValue += price * etf.quantity;
        });
    }

    // Calculate crypto value
    if (portfolio.crypto) {
        portfolio.crypto.forEach(crypto => {
            const cachedData = (priceCache.crypto && priceCache.crypto[crypto.name]) || {};
            const price = cachedData.price || 0;
            let value = price * crypto.quantity;
            if (crypto.currency === 'USD') value = value / eurUsdRate;
            totalValue += value;
        });
    }

    // Calculate static assets value
    if (portfolio.static) {
        portfolio.static.forEach(asset => {
            if (asset.values && asset.values.length > 0) {
                const latest = asset.values.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
                let value = latest.value;
                if (latest.currency === 'USD') value = value / eurUsdRate;
                totalValue += value;
            }
        });
    }

    // Add CS2 value
    if (portfolio.cs2) {
        let cs2Value = 0;
        if (typeof portfolio.cs2.value === 'number' && portfolio.cs2.currency === 'EUR') {
            cs2Value = portfolio.cs2.value;
        } else if (portfolio.cs2.portfolios) {
            const totalUsd = Object.values(portfolio.cs2.portfolios)
                .reduce((sum, p) => sum + (p.value || 0), 0);
            cs2Value = totalUsd / eurUsdRate;
        } else {
            const playItemsValue = portfolio.cs2.playItems?.value || 0;
            const investmentItemsValue = portfolio.cs2.investmentItems?.value || 0;
            cs2Value = (playItemsValue + investmentItemsValue) / eurUsdRate;
        }
        totalValue += cs2Value;
    }

    return totalValue;
}
