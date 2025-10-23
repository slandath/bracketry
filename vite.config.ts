import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader()],
});
