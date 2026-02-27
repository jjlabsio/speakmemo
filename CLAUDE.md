# CLAUDE.md

> 프로젝트 개요, 기술 스택, 구조, 커맨드는 [README.md](./README.md)를 참조하세요.
> MVP 상세 계획은 [PRD](./docs/prd.md)를 참조하세요.
> 서비스 브랜딩(이름, 카피, 톤앤매너, UI 문구)은 [브랜딩 가이드](./docs/branding.md)를 참조하세요.
> 랜딩 페이지 기획(섹션 구조, 콘텐츠, SEO, 디자인 방향)은 [랜딩 페이지 기획](./docs/landing-page.md)를 참조하세요.

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
