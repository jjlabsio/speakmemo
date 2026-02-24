# CLAUDE.md

> 프로젝트 개요, 기술 스택, 구조, 커맨드는 [README.md](./README.md)를 참조하세요.
> MVP 상세 계획은 [PRD](./docs/prd.md)를 참조하세요.

---

## Conventions

### File Organization

- Path alias: `@/*` maps to `./src/*` in each app
- Components: `src/components/`
- Styles: `src/styles/`
- Types: `src/types/`

### New App Setup

New apps under `apps/` should:

1. Extend `@repo/typescript-config/nextjs.json`
2. Use `@repo/eslint-config/next.js`
3. Import shared components from `@repo/ui`
4. Transpile `@repo/ui`, `@repo/database`, `@repo/auth` in `next.config.ts`

### Pre-commit

Husky runs lint-staged on commit: ESLint auto-fix + Prettier formatting for `*.ts`, `*.tsx`, `*.json`, `*.md` files.
