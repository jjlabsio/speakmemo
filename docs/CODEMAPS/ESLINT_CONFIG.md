# ESLint Config (@repo/eslint-config) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `next.js`, `base.js`

## Architecture

```
@repo/eslint-config
├── next.js              # ESLint config for Next.js apps
├── base.js              # Base ESLint config for node/library packages
└── package.json
```

## Configurations

### `next.js` - Next.js Applications

**Usage:**

```javascript
// apps/app/eslint.config.js
import nextConfig from "@repo/eslint-config/next.js";

export default nextConfig;
```

**Rules applied:**

- ESLint recommended rules
- TypeScript strict rules
- React/React Hooks rules
- Next.js best practices (next/no-html-link-for-pages, etc.)

**Coverage:**

- Lints `.ts`, `.tsx` files
- Includes React component rules
- Enforces Next.js conventions

---

### `base.js` - Library Packages

**Usage:**

```javascript
// packages/storage/eslint.config.js
import baseConfig from "@repo/eslint-config/base.js";

export default baseConfig;
```

**Rules applied:**

- ESLint recommended rules
- TypeScript strict rules
- Node.js best practices

**Coverage:**

- Lints `.ts`, `.js` files
- No React rules
- Library-focused conventions

---

## Flat Config Format

All configs use ESLint 9+ flat config (not legacy `.eslintrc`):

```javascript
export default [
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: { project: true },
    },
    rules: {
      "@typescript-eslint/strict-equality-operators": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      // ... more rules
    },
  },
  // ... more configs
];
```

## Common Rules

**Always enforced:**

- TypeScript strict mode rules
- No unused variables
- No console.log in production (warn)
- Require const over let/var
- Enforce immutability patterns
- No any type (TypeScript)

**Next.js specific:**

- No unescaped HTML entities
- No HTML anchor tags (use <Link>)
- Image optimization rules

## Usage in Monorepo

```bash
# Lint all files in a package
pnpm --filter @repo/storage lint

# Fix linting issues
pnpm --filter @repo/storage lint --fix

# Root level (all apps/packages)
pnpm lint
```

## Related Areas

- **[@repo/typescript-config](./TYPESCRIPT_CONFIG.md)** - TypeScript compiler settings
- **[ROOT](./INDEX.md)** - Project-wide code quality standards

---

## Status

**Stable** - Shared linting configuration for all packages and apps
