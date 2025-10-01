import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        // adjust the glob to match your repo layout / oxlint usage
        lintCommand: 'npm run lint',
      },
      // show overlay in dev, but avoid noisy overlay in CI
      overlay: !process.env.CI,
    }),
  ],
});
