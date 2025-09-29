import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.js'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx,js,jsx}'
    ],
    coverage: {
      reporter: ['text', 'lcov'],
      all: true,
      exclude: ['**/node_modules/**', 'test/**', 'vitest.config.ts'],
    },
    mockReset: true,         // isolates mocks between tests
    watch: false,
  },
});
