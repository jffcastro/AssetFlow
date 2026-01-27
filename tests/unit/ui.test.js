// UI Module Tests
// Tests for notification, exchange rate labels, and timestamp utilities

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
    showNotification,
    updateTotalValueBar,
    updateExchangeRateLabel,
    resetExchangeRateLabels,
    updateLastUpdateTime,
    setLastUpdateTime
} from '../../js/modules/ui.js';

describe('showNotification', () => {
    let mockBody;
    let mockElement;

    beforeEach(() => {
        // Create a mock element for notifications
        mockElement = {
            className: '',
            textContent: '',
            style: {}
        };

        // Mock document.createElement
        document.createElement = jest.fn((tag) => {
            mockElement = {
                className: '',
                textContent: '',
                style: {}
            };
            return mockElement;
        });

        // Mock body
        mockBody = {
            children: [],
            appendChild: jest.fn(function(child) {
                this.children.push(child);
                return child;
            }),
            removeChild: jest.fn(function(child) {
                const idx = this.children.indexOf(child);
                if (idx > -1) this.children.splice(idx, 1);
                return child;
            })
        };

        // Store original body and replace with mock
        const originalBody = document.body;
        Object.defineProperty(document, 'body', {
            get: () => mockBody,
            configurable: true
        });

        // Mock setTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        // Restore original body behavior
        Object.defineProperty(document, 'body', {
            get: () => ({ appendChild: () => {}, removeChild: () => {} }),
            configurable: true
        });
    });

    test('creates notification with default info type', () => {
        showNotification('Test message');

        expect(document.createElement).toHaveBeenCalledWith('div');
        expect(mockBody.appendChild).toHaveBeenCalledTimes(1);
        const notification = mockBody.appendChild.mock.calls[0][0];
        expect(notification.className).toContain('bg-blue-600');
        expect(notification.textContent).toBe('Test message');
    });

    test('creates success notification with green background', () => {
        showNotification('Success!', 'success');

        const notification = mockBody.appendChild.mock.calls[0][0];
        expect(notification.className).toContain('bg-green-600');
    });

    test('creates error notification with red background', () => {
        showNotification('Error!', 'error');

        const notification = mockBody.appendChild.mock.calls[0][0];
        expect(notification.className).toContain('bg-red-600');
    });

    test('removes notification after 3 seconds', () => {
        showNotification('Test message');

        expect(mockBody.children).toHaveLength(1);

        // Fast-forward time
        jest.advanceTimersByTime(3000);

        expect(mockBody.removeChild).toHaveBeenCalledTimes(1);
        expect(mockBody.children).toHaveLength(0);
    });

    test('has z-50 and fixed positioning classes', () => {
        showNotification('Test message');

        const notification = mockBody.appendChild.mock.calls[0][0];
        expect(notification.className).toContain('fixed');
        expect(notification.className).toContain('top-4');
        expect(notification.className).toContain('right-4');
        expect(notification.className).toContain('z-50');
    });
});

describe('updateTotalValueBar', () => {
    beforeEach(() => {
        // Create mock DOM elements
        const mockElements = {
            'portfolio-total-eur': { textContent: '' },
            'portfolio-total-usd': { textContent: '' },
            'portfolio-total-btc': { textContent: '' },
            'portfolio-total-eth': { textContent: '' },
            'eur-btc-rate-label': { textContent: '' },
            'eur-eth-rate-label': { textContent: '' }
        };

        document.getElementById = jest.fn((id) => mockElements[id] || null);
    });

    test('updates EUR value correctly', () => {
        updateTotalValueBar(10000, 1.1, {});

        const eurEl = document.getElementById('portfolio-total-eur');
        expect(eurEl.textContent).toBe('€10,000');
    });

    test('converts to USD using exchange rate', () => {
        updateTotalValueBar(10000, 1.1, {});

        const usdEl = document.getElementById('portfolio-total-usd');
        expect(usdEl.textContent).toBe('$11,000');
    });

    test('calculates BTC value from crypto rates', () => {
        updateTotalValueBar(50000, 1.1, { btc: 50000, eth: 3000 });

        const btcEl = document.getElementById('portfolio-total-btc');
        expect(btcEl.textContent).toBe('₿1.0000');
    });

    test('calculates ETH value from crypto rates', () => {
        updateTotalValueBar(30000, 1.1, { btc: 50000, eth: 3000 });

        const ethEl = document.getElementById('portfolio-total-eth');
        expect(ethEl.textContent).toBe('Ξ10.0000');
    });

    test('shows EUR/BTC rate label', () => {
        updateTotalValueBar(50000, 1.1, { btc: 50000, eth: 3000 });

        const btcLabel = document.getElementById('eur-btc-rate-label');
        expect(btcLabel.textContent).toContain('EUR/BTC');
    });

    test('shows EUR/ETH rate label', () => {
        updateTotalValueBar(30000, 1.1, { btc: 50000, eth: 3000 });

        const ethLabel = document.getElementById('eur-eth-rate-label');
        expect(ethLabel.textContent).toContain('EUR/ETH');
    });

    test('handles missing crypto rates gracefully', () => {
        updateTotalValueBar(10000, 1.1, null);

        const btcEl = document.getElementById('portfolio-total-btc');
        expect(btcEl.textContent).toBe('₿--');
    });

    test('handles missing DOM elements gracefully', () => {
        document.getElementById = jest.fn(() => null);

        // Should not throw
        expect(() => updateTotalValueBar(10000, 1.1, {})).not.toThrow();
    });
});

describe('updateExchangeRateLabel', () => {
    beforeEach(() => {
        const mockElements = {
            'exchange-rate': { textContent: '' },
            'eur-btc-rate-label': { textContent: '' },
            'eur-eth-rate-label': { textContent: '' }
        };

        document.getElementById = jest.fn((id) => mockElements[id] || null);
    });

    test('updates label with valid exchange rate', () => {
        updateExchangeRateLabel(1.08);

        const el = document.getElementById('exchange-rate');
        expect(el.textContent).toBe('EUR/USD: $1.0800');
    });

    test('shows placeholder for invalid rate', () => {
        updateExchangeRateLabel(NaN);

        const el = document.getElementById('exchange-rate');
        expect(el.textContent).toBe('EUR/USD: --');
    });

    test('shows placeholder for zero rate', () => {
        updateExchangeRateLabel(0);

        const el = document.getElementById('exchange-rate');
        expect(el.textContent).toBe('EUR/USD: --');
    });

    test('shows placeholder for negative rate', () => {
        updateExchangeRateLabel(-1);

        const el = document.getElementById('exchange-rate');
        expect(el.textContent).toBe('EUR/USD: --');
    });

    test('handles missing DOM element gracefully', () => {
        document.getElementById = jest.fn(() => null);

        expect(() => updateExchangeRateLabel(1.1)).not.toThrow();
    });
});

describe('resetExchangeRateLabels', () => {
    beforeEach(() => {
        const mockElements = {
            'exchange-rate': { textContent: '' },
            'eur-btc-rate-label': { textContent: '' },
            'eur-eth-rate-label': { textContent: '' }
        };

        document.getElementById = jest.fn((id) => mockElements[id] || null);
    });

    test('sets main exchange rate to loading', () => {
        resetExchangeRateLabels();

        const el = document.getElementById('exchange-rate');
        expect(el.textContent).toBe('EUR/USD: Loading...');
    });

    test('sets BTC label to loading', () => {
        resetExchangeRateLabels();

        const el = document.getElementById('eur-btc-rate-label');
        expect(el.textContent).toBe('EUR/BTC: Loading...');
    });

    test('sets ETH label to loading', () => {
        resetExchangeRateLabels();

        const el = document.getElementById('eur-eth-rate-label');
        expect(el.textContent).toBe('EUR/ETH: Loading...');
    });

    test('handles missing DOM elements gracefully', () => {
        document.getElementById = jest.fn(() => null);

        expect(() => resetExchangeRateLabels()).not.toThrow();
    });
});

describe('updateLastUpdateTime', () => {
    let mockElement;

    beforeEach(() => {
        mockElement = { textContent: '', title: '' };
        document.getElementById = jest.fn(() => mockElement);
        localStorage.clear();
    });

    test('shows "Never updated" when no timestamp exists', () => {
        updateLastUpdateTime();

        expect(mockElement.textContent).toBe('Never updated');
    });

    test('shows "Just now" for recent updates', () => {
        const recentTime = new Date().toISOString();
        localStorage.setItem('portfolioPilotLastUpdate', recentTime);

        updateLastUpdateTime();

        expect(mockElement.textContent).toBe('Last: Just now');
    });

    test('shows minutes ago for updates within an hour', () => {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString();
        localStorage.setItem('portfolioPilotLastUpdate', thirtyMinsAgo);

        updateLastUpdateTime();

        expect(mockElement.textContent).toContain('m ago');
    });

    test('shows hours ago for updates within a day', () => {
        const fiveHoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
        localStorage.setItem('portfolioPilotLastUpdate', fiveHoursAgo);

        updateLastUpdateTime();

        expect(mockElement.textContent).toContain('h ago');
    });

    test('shows days ago for older updates', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
        localStorage.setItem('portfolioPilotLastUpdate', threeDaysAgo);

        updateLastUpdateTime();

        expect(mockElement.textContent).toContain('d ago');
    });

    test('sets title to formatted date string', () => {
        const fixedTime = '2024-06-15T10:30:00.000Z';
        localStorage.setItem('portfolioPilotLastUpdate', fixedTime);

        updateLastUpdateTime();

        expect(mockElement.title).toContain('2024');
        expect(mockElement.title).toContain('15');
    });

    test('handles missing DOM element gracefully', () => {
        document.getElementById = jest.fn(() => null);

        expect(() => updateLastUpdateTime()).not.toThrow();
    });
});

describe('setLastUpdateTime', () => {
    let mockElement;

    beforeEach(() => {
        mockElement = { textContent: '', title: '' };
        document.getElementById = jest.fn(() => mockElement);
        localStorage.clear();
    });

    test('stores current timestamp in localStorage', () => {
        setLastUpdateTime();

        const stored = localStorage.getItem('portfolioPilotLastUpdate');
        expect(stored).toBeTruthy();
        expect(new Date(stored)).toBeInstanceOf(Date);
    });

    test('updates the display', () => {
        setLastUpdateTime();

        expect(mockElement.textContent).toContain('Last:');
    });

    test('stores valid ISO date string', () => {
        setLastUpdateTime();

        const stored = localStorage.getItem('portfolioPilotLastUpdate');
        expect(() => new Date(stored)).not.toThrow();
    });
});
