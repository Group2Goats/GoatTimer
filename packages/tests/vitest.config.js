import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const testsRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testsRoot, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@backend": path.resolve(repoRoot, "packages/backend"),
      "@frontend": path.resolve(repoRoot, "packages/frontend/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./setupTests.js"],
    coverage: {
      provider: 'v8',

      // collect coverage for files outside the tests package
      allowExternal: true,

      // Only collect frontend source coverage
      include: ["frontend/src/**/*.{js,jsx}"],

      // Exclude frontend entry/config files and the entire backend
      exclude: [
        "frontend/src/main.jsx",
        "frontend/src/vite-env.d.ts",
        "backend/**",
        "backend/**/*",
      ],
      
    },
  },
});
