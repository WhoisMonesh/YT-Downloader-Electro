import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "mobile/**"],
    css: true,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@renderer": path.resolve(__dirname, "src/renderer"),
    },
  },
});
