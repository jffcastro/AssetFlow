/**
 * Polyfills for Node.js environment
 * This file must be loaded before any other test files
 */

// Polyfill TextEncoder/TextDecoder for Node.js
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill URL for older Node.js versions
if (!global.URL) {
  global.URL = require('url').URL;
}
