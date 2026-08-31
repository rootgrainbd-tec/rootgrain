import { defineConfig } from "vitest/config";
import path from "path";
import * as dotenv from 'dotenv';

// Explicitly load the local test environment so vitest uses it instead of falling back to .env
dotenv.config({ path: '.env.test.local' });

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    passWithNoTests: true,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
