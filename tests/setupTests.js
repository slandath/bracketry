// test/setupTests.js

import "@testing-library/jest-dom";
import { vi } from "vitest";

console.log("✅ setupTests.js loaded");

// Polyfill window.matchMedia (jsdom doesn't provide it)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but still used by some libs
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill ResizeObserver (used in bracket layout)
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

// Optionally silence noisy React act warnings
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    /Warning.*not wrapped in act/.test(args[0])
  ) {
    return;
  }
  originalError.call(console, ...args);
};
