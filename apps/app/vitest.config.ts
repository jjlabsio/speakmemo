/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        "node_modules",
        ".next/**",
        "src/test/**",
        // Next.js framework files
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/app/api/auth/**",
        "src/app/(public)/**",
        "src/app/(authenticated)/layout.tsx",
        "src/app/(authenticated)/(standard)/layout.tsx",
        // Page entry points (composition only, no testable logic)
        "src/app/(authenticated)/(standard)/home/page.tsx",
        "src/app/(authenticated)/(standard)/about/page.tsx",
        // Existing pre-recorder components (out of scope for this TDD session)
        "src/components/app-footer.tsx",
        "src/components/app-header.tsx",
        "src/components/mobile-nav.tsx",
        "src/components/theme-toggle.tsx",
        "src/components/user-menu.tsx",
        "src/components/providers.tsx",
        "src/styles/**",
        "src/types/**",
        "src/proxy.ts",
        "**/*.d.ts",
        "vitest.config.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "eslint.config.js",
      ],
      include: ["src/**/*.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Stub `server-only` so Vitest can import Next.js server modules without
      // triggering the runtime guard that throws in non-server environments.
      "server-only": path.resolve(__dirname, "./src/test/server-only-mock.ts"),
      "@repo/ui/components/button": path.resolve(
        __dirname,
        "../../packages/ui/src/components/button.tsx",
      ),
      "@repo/ui/components/card": path.resolve(
        __dirname,
        "../../packages/ui/src/components/card.tsx",
      ),
      "@repo/ui/lib/cn": path.resolve(
        __dirname,
        "../../packages/ui/src/lib/cn.ts",
      ),
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
