import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setupTests.js"],
    // Keep unit tests and JS/TS tests under tests/, but exclude e2e explicitly
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx,js,jsx}",
    ],
    exclude: ["tests/e2e/**"],

    coverage: {
      reporter: ["text", "lcov"],
      all: true,
      exclude: ["**/node_modules/**", "tests/e2e/**", "vitest.config.ts"],
    },
    mockReset: true,
    watch: false,
  },
});
