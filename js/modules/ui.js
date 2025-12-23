// UI Module
// Functions for user interface interactions

/**
 * Shows a notification toast message.
 * @param {string} message - The message to display
 * @param {string} type - 'info', 'success', or 'error'
 */
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

/**
 * Updates the total value bar in the header with EUR, USD, BTC, ETH values.
 * @param {number} eurValue - The total value in EUR
 * @param {number} eurUsdRate - Current EUR/USD rate
 * @param {object} cryptoRates - Object with btc and eth EUR prices
 */
export function updateTotalValueBar(eurValue, eurUsdRate, cryptoRates) {
    const elEur = document.getElementById('portfolio-total-eur');
    const elUsd = document.getElementById('portfolio-total-usd');
    const elBtc = document.getElementById('portfolio-total-btc');
    const elEth = document.getElementById('portfolio-total-eth');
    const elEurBtc = document.getElementById('eur-btc-rate-label');
    const elEurEth = document.getElementById('eur-eth-rate-label');

    if (elEur) elEur.textContent = `€${eurValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (elUsd) elUsd.textContent = `$${(eurValue * eurUsdRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    if (cryptoRates && cryptoRates.btc && cryptoRates.eth) {
        if (elBtc) elBtc.textContent = `₿${(eurValue / cryptoRates.btc).toFixed(4)}`;
        if (elEth) elEth.textContent = `Ξ${(eurValue / cryptoRates.eth).toFixed(4)}`;
        if (elEurBtc) elEurBtc.textContent = `EUR/BTC: ₿${(1 / cryptoRates.btc).toFixed(6)}`;
        if (elEurEth) elEurEth.textContent = `EUR/ETH: Ξ${(1 / cryptoRates.eth).toFixed(6)}`;
    } else {
        if (elBtc) elBtc.textContent = '₿--';
        if (elEth) elEth.textContent = 'Ξ--';
        if (elEurBtc) elEurBtc.textContent = 'EUR/BTC: --';
        if (elEurEth) elEurEth.textContent = 'EUR/ETH: --';
    }
}

/**
 * Updates the exchange rate label in the header.
 * @param {number} eurUsdRate - Current EUR/USD rate
 */
export function updateExchangeRateLabel(eurUsdRate) {
    const exchangeRateElement = document.getElementById('exchange-rate');
    const eurBtcLabel = document.getElementById('eur-btc-rate-label');
    const eurEthLabel = document.getElementById('eur-eth-rate-label');

    // Update main EUR/USD exchange rate
    if (exchangeRateElement) {
        if (eurUsdRate && !isNaN(eurUsdRate) && eurUsdRate > 0) {
            exchangeRateElement.textContent = `EUR/USD: $${eurUsdRate.toFixed(4)}`;
        } else {
            exchangeRateElement.textContent = 'EUR/USD: --';
        }
    }
}

/**
 * Resets exchange rate labels to loading state.
 */
export function resetExchangeRateLabels() {
    const exchangeRateElement = document.getElementById('exchange-rate');
    const eurBtcLabel = document.getElementById('eur-btc-rate-label');
    const eurEthLabel = document.getElementById('eur-eth-rate-label');

    if (exchangeRateElement) exchangeRateElement.textContent = 'EUR/USD: Loading...';
    if (eurBtcLabel) eurBtcLabel.textContent = 'EUR/BTC: Loading...';
    if (eurEthLabel) eurEthLabel.textContent = 'EUR/ETH: Loading...';
}

/**
 * Updates the "Last Updated" timestamp display.
 */
export function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('last-update');
    if (!lastUpdateElement) return;

    const lastUpdate = localStorage.getItem('portfolioPilotLastUpdate');
    if (lastUpdate) {
        const date = new Date(lastUpdate);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeAgo = '';
        if (days > 0) {
            timeAgo = `${days}d ago`;
        } else if (hours > 0) {
            timeAgo = `${hours}h ago`;
        } else if (minutes > 0) {
            timeAgo = `${minutes}m ago`;
        } else {
            timeAgo = 'Just now';
        }

        lastUpdateElement.textContent = `Last: ${timeAgo}`;
        lastUpdateElement.title = date.toLocaleString();
    } else {
        lastUpdateElement.textContent = 'Never updated';
    }
}

/**
 * Sets the last update timestamp to now.
 */
export function setLastUpdateTime() {
    localStorage.setItem('portfolioPilotLastUpdate', new Date().toISOString());
    updateLastUpdateTime();
}
