// Polyfills for Jest testing environment
globalThis.TextEncoder = class TextEncoder {
    encode() { return new Uint8Array(); }
    encodeInto() { return { read: 0, written: 0 }; }
};

globalThis.TextDecoder = class TextDecoder {
    decode() { return ''; }
};

// Mock localStorage - simple implementation
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get store() { return store; }
    };
})();

globalThis.localStorage = localStorageMock;

// Mock fetch - will be reset in setup.js
globalThis.fetch = () => Promise.resolve(new Response());
