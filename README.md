# speakmemo

> **"말하면 바로 정리된 노트가 나온다"**

음성 녹음 → AI 전사 → 자동 구조화까지 한 번에 처리하는 음성 메모 SaaS 앱.

녹음 버튼을 탭하고 말하면, Whisper로 전사하고 LLM이 요약 / 핵심 포인트 / 할 일 목록을 자동으로 추출한다.

## Core Flow

```
녹음 버튼 탭 → 말하기 → 완료
    → STT 전사 (Whisper API)
    → LLM 구조화 (요약 + 핵심 포인트 + 액션아이템 + 태그)
    → 노트 저장 및 열람
```

## MVP Scope

**포함**

- 모바일 웹 앱 (PWA)
- 음성 녹음 및 STT 전사
- LLM 기반 구조화 (요약 / 핵심 포인트 / 액션아이템 자동 추출)
- 노트 목록 및 상세 조회
- Google OAuth 로그인
- 랜딩 페이지

**제외 (Post-MVP)**

- 네이티브 앱 (iOS/Android)
- 외부 연동 (Notion, Jira, Calendar 등)
- 팀/협업 기능
- 커스텀 프롬프트/템플릿
- 결제/구독 시스템
- 실시간 스트리밍 전사

---

## Tech Stack

| Category  | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | Next.js 16, React 19                          |
| Language  | TypeScript 5.7 (strict mode)                  |
| Monorepo  | Turborepo 2.6, pnpm 10.4                      |
| Styling   | Tailwind CSS v4, shadcn/ui (radix-vega theme) |
| Font      | Pretendard Variable (local)                   |
| Linting   | ESLint 9 (flat config), Prettier              |
| Auth      | Better Auth (Google OAuth, Prisma adapter)    |
| Database  | Prisma ORM, PostgreSQL                        |
| Git Hooks | Husky + lint-staged                           |
| Runtime   | Node.js >= 20                                 |

## Project Structure

```
apps/
  app/              # SaaS 애플리케이션 (port 3000)
  web/              # 랜딩페이지 (port 3001) - 추가 예정
packages/
  auth/             # Better Auth 서버/클라이언트 설정
  database/         # Prisma 클라이언트, 스키마, 마이그레이션
  ui/               # 공유 UI 컴포넌트, hooks, utils
  eslint-config/    # 공유 ESLint 설정
  typescript-config/ # 공유 TypeScript 설정
```

## Getting Started

### 개발 서버 실행

```bash
docker compose up -d                          # PostgreSQL 실행
pnpm --filter @repo/database db:migrate:dev   # 마이그레이션 실행
pnpm dev                                      # 개발 서버 실행
```

## Commands

```bash
pnpm dev          # 모든 앱 개발 서버 실행
pnpm build        # 모든 앱 빌드
pnpm lint         # 린트 검사
pnpm typecheck    # 타입 검사
pnpm format       # Prettier 포매팅
```

### Database

```bash
pnpm --filter @repo/database db:migrate:dev      # 개발 마이그레이션 생성 및 적용
pnpm --filter @repo/database db:migrate:deploy   # 프로덕션 마이그레이션 적용
pnpm --filter @repo/database db:studio           # Prisma Studio 실행
```

## Adding Components

```bash
npx shadcn@latest add <component-name> -c packages/ui
```

앱에서 사용할 때는 `@repo/ui`에서 import합니다:

```tsx
import { Button } from "@repo/ui/components/button";
```

## Workspace Packages

| Package                      | Import                    | Description                      |
| ---------------------------- | ------------------------- | -------------------------------- |
| `packages/auth`              | `@repo/auth`              | Better Auth 서버/클라이언트 설정 |
| `packages/database`          | `@repo/database`          | Prisma 클라이언트, 스키마        |
| `packages/ui`                | `@repo/ui`                | 공유 UI 컴포넌트                 |
| `packages/eslint-config`     | `@repo/eslint-config`     | 공유 ESLint 설정                 |
| `packages/typescript-config` | `@repo/typescript-config` | 공유 TypeScript 설정             |
