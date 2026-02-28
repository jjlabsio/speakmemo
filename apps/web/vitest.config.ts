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
        // Server-only Next.js files (not testable with jsdom)
        "src/app/sitemap.ts",
        "src/app/robots.ts",
        "src/app/opengraph-image.tsx",
        // JSON-LD is simple data, no logic to test
        "src/app/_components/json-ld.tsx",
        // Layout and providers - Next.js specific, not testable in jsdom
        "src/app/layout.tsx",
        "src/components/providers.tsx",
        // Page entry points (composition only, no logic)
        "src/app/page.tsx",
        "src/app/blog/page.tsx",
        "src/app/pricing/page.tsx",
        // Out-of-scope legacy Acme components (Phase 0 scope excludes blog/pricing)
        "src/app/_components/hero.tsx",
        "src/app/_components/social-proof.tsx",
        "src/app/_components/testimonials.tsx",
        "src/app/_components/cta-section.tsx",
        "src/app/_components/feature-block.tsx",
        "src/app/_components/feature-intro.tsx",
        "src/app/_components/differentiator.tsx",
        "src/app/_components/dark-features.tsx",
        "src/app/blog/**",
        "src/app/pricing/**",
        "src/styles/**",
        "src/types/**",
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
      // Map @repo/ui imports to the actual package source
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
