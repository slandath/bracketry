import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      all: true,
      exclude: ['**/node_modules/**', 'test/**', 'vitest.config.ts'],
    },
    mockReset: true,         // isolates mocks between tests
    watch: false,
  },
});
