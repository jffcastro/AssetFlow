// Test setup file
import '@testing-library/jest-dom';

// Reset localStorage before each test
beforeEach(() => {
    globalThis.localStorage.clear();
});
