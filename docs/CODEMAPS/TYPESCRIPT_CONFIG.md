# TypeScript Config (@repo/typescript-config) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `nextjs.json`, `base.json`, `react-library.json`

## Architecture

```
@repo/typescript-config
├── base.json              # Base TypeScript config (all projects)
├── nextjs.json            # Next.js apps (extends base)
├── react-library.json     # React libraries (extends base)
└── package.json
```

## Configurations

### `base.json` - Foundation

**Settings:**

```json
{
  "compilerOptions": {
    "strict": true, // Strict type checking
    "esModuleInterop": true, // CommonJS/ESM compatibility
    "skipLibCheck": true, // Skip .d.ts checking in node_modules
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true, // Import JSON files
    "declaration": true, // Generate .d.ts
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

**Coverage:** All projects (base configuration)

---

### `nextjs.json` - Next.js Applications

**Extends:** `base.json`

**Additional settings:**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2020", "dom", "dom.iterable"],
    "jsx": "preserve", // Keep JSX for Next.js compiler
    "allowJs": true, // Allow .js alongside .ts
    "incremental": true // Faster rebuilds
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

**Usage:**

```json
// apps/app/tsconfig.json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### `react-library.json` - React Libraries

**Extends:** `base.json`

**Additional settings:**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2020", "dom", "dom.iterable"],
    "jsx": "react-jsx", // React 17+ JSX transform
    "declaration": true, // Generate types
    "declarationMap": true, // Source map for declarations
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**Usage:**

```json
// packages/ui/tsconfig.json
{
  "extends": "@repo/typescript-config/react-library.json"
}
```

---

## Compiler Options Reference

| Option                             | Value                       | Purpose                                    |
| ---------------------------------- | --------------------------- | ------------------------------------------ |
| `strict`                           | `true`                      | Enables all strict type checks             |
| `target`                           | `ES2020`                    | JavaScript version target                  |
| `module`                           | `ESNext`                    | Module format (bundlers handle conversion) |
| `lib`                              | `ES2020, dom, dom.iterable` | Built-in type definitions                  |
| `skipLibCheck`                     | `true`                      | Skip type checking in dependencies         |
| `forceConsistentCasingInFileNames` | `true`                      | Error on case mismatches                   |
| `jsx`                              | `preserve` / `react-jsx`    | JSX handling mode                          |
| `declaration`                      | `true`                      | Generate .d.ts files                       |
| `esModuleInterop`                  | `true`                      | CommonJS/ESM interop                       |
| `resolveJsonModule`                | `true`                      | Allow JSON imports                         |

## Strict Mode Implications

With `strict: true`, enforced:

- `noImplicitAny` - No `any` type unless explicit
- `noImplicitThis` - `this` must be typed
- `alwaysStrict` - Use "use strict"
- `strictNullChecks` - `null`/`undefined` require explicit types
- `strictFunctionTypes` - Function parameter types strictly checked
- `strictBindCallApply` - `bind()`, `call()`, `apply()` strict validation
- `strictPropertyInitialization` - Class properties must be initialized

## Path Aliases

**In Next.js apps:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Enables:

```typescript
import { Button } from "@/components/button"; // Instead of "./src/components/button"
```

## IDE Integration

- **VS Code:** Auto-detects `tsconfig.json`
- **Go to Definition:** Works across packages
- **Autocomplete:** Uses type definitions
- **Error Highlighting:** Real-time type checking

## Build & Type Checking

```bash
# Type check (no emit)
pnpm typecheck

# Type check specific package
pnpm --filter @repo/storage typecheck

# Build with tsc (generates .js and .d.ts)
tsc --build
```

## Related Areas

- **[@repo/eslint-config](./ESLINT_CONFIG.md)** - Linting rules (works with TypeScript)
- **[ROOT](./INDEX.md)** - Type safety standards across monorepo

---

## Status

**Stable** - Shared TypeScript configuration for strict type safety
