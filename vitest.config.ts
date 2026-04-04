import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/cliniq-core/budget-gap/**/*.ts"],
      exclude: [
        "lib/cliniq-core/budget-gap/**/*.test.ts",
        "lib/cliniq-core/budget-gap/index.ts",
      ],
    },
  },
})
