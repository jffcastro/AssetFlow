// Performance Optimization Module
// Provides utilities for caching, debouncing, and batched operations

/**
 * Creates a debounced version of a function that delays invoking func
 * until after wait milliseconds have elapsed since the last time the
 * debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Creates a throttled version of a function that only invokes func
 * at most once per every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @returns {Function} The throttled function
 */
export function throttle(func, wait = 300) {
    let lastCall = 0;
    return function executedFunction(...args) {
        const now = Date.now();
        if (now - lastCall >= wait) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * Cache for DOM queries to avoid repeated getElementById calls
 */
const domCache = new Map();

/**
 * Gets a DOM element with caching to improve performance
 * @param {string} id - The element ID
 * @returns {Element|null} The DOM element or null if not found
 */
export function getCachedElement(id) {
    if (domCache.has(id)) {
        return domCache.get(id);
    }
    const element = document.getElementById(id);
    if (element) {
        domCache.set(id, element);
    }
    return element;
}

/**
 * Gets multiple DOM elements with caching
 * @param {string[]} ids - Array of element IDs
 * @returns {Object} Object with IDs as keys and elements as values
 */
export function getCachedElements(ids) {
    const result = {};
    for (const id of ids) {
        result[id] = getCachedElement(id);
    }
    return result;
}

/**
 * Clears the DOM element cache
 */
export function clearDomCache() {
    domCache.clear();
}

/**
 * Batched localStorage operations queue
 */
const storageQueue = [];
let flushTimeout = null;
const FLUSH_DELAY = 100; // ms to wait before flushing queue

/**
 * Queues a localStorage operation for batched execution
 * @param {string} key - The localStorage key
 * @param {*} value - The value to store (will be JSON stringified)
 */
export function queueStorageWrite(key, value) {
    storageQueue.push({ key, value, timestamp: Date.now() });
    
    if (!flushTimeout) {
        flushTimeout = setTimeout(flushStorageQueue, FLUSH_DELAY);
    }
}

/**
 * Flushes all queued storage operations
 */
export function flushStorageQueue() {
    if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }
    
    if (storageQueue.length === 0) return;
    
    // Group operations by key (keep only the latest value for each key)
    const grouped = new Map();
    for (const op of storageQueue) {
        grouped.set(op.key, op.value);
    }
    
    // Execute all writes
    for (const [key, value] of grouped) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving ${key} to localStorage:`, e);
        }
    }
    
    // Clear queue
    storageQueue.length = 0;
}

/**
 * Gets the current queue length (for debugging/testing)
 * @returns {number} Number of queued operations
 */
export function getStorageQueueLength() {
    return storageQueue.length;
}

/**
 * Forces immediate flush of all queued operations
 */
export function forceFlushStorageQueue() {
    flushStorageQueue();
}

/**
 * Memoization cache with TTL support
 */
const memoCache = new Map();

/**
 * Creates a memoized version of a function with TTL support
 * @param {Function} func - The function to memoize
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 * @returns {Function} The memoized function
 */
export function memoizeWithTTL(func, ttl = 3600000) {
    return function memoized(...args) {
        const key = JSON.stringify(args);
        const now = Date.now();
        
        if (memoCache.has(key)) {
            const cached = memoCache.get(key);
            if (now - cached.timestamp < ttl) {
                return cached.value;
            }
        }
        
        const result = func(...args);
        memoCache.set(key, { value: result, timestamp: now });
        return result;
    };
}

/**
 * Clears the memoization cache
 */
export function clearMemoCache() {
    memoCache.clear();
}

/**
 * Gets memo cache statistics (for debugging)
 * @returns {Object} Cache statistics
 */
export function getMemoCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    
    for (const [, entry] of memoCache) {
        const age = now - entry.timestamp;
        // Assume 1 hour TTL for stats
        if (age < 3600000) {
            validCount++;
        } else {
            expiredCount++;
        }
    }
    
    return {
        size: memoCache.size,
        valid: validCount,
        expired: expiredCount
    };
}

/**
 * Cleanup utility for periodic maintenance
 * Call this periodically (e.g., every 5 minutes) to clean up expired entries
 * @param {number} maxAge - Maximum age in ms (default: 1 hour)
 */
export function cleanupCaches(maxAge = 3600000) {
    const now = Date.now();
    
    // Clean memo cache
    for (const [key, entry] of memoCache) {
        if (now - entry.timestamp > maxAge) {
            memoCache.delete(key);
        }
    }
    
    // Note: DOM cache is not cleaned as elements persist
}

/**
 * Sets up automatic cache cleanup interval
 * @param {number} intervalMs - Cleanup interval in milliseconds
 * @returns {number} The interval ID (for cancellation)
 */
export function startAutoCleanup(intervalMs = 300000) { // 5 minutes default
    return setInterval(() => cleanupCaches(), intervalMs);
}

/**
 * Stops automatic cache cleanup
 * @param {number} intervalId - The interval ID from startAutoCleanup
 */
export function stopAutoCleanup(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
    }
}
