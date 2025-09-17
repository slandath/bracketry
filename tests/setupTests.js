// 1. Import @jest/globals helpers (in ESM you need this for jest.fn, etc.)
import { jest } from '@jest/globals';

// 2. Polyfill window.matchMedia (JSDOM doesn’t provide it)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated but used by some libs
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 3. Polyfill ResizeObserver (used in your bracket layout)
import ResizeObserver from 'resize-observer-polyfill';
global.ResizeObserver = ResizeObserver;

// 4. (Optional) Silence noisy console warnings from React 18 strict mode
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};