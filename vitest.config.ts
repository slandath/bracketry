import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setupTests.js"],
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
