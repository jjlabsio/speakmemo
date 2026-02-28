# speakmemo Codemap Index

**Last Updated:** 2026-02-28

Monorepo structure and navigation guide for the speakmemo application.

---

## Monorepo Architecture

```
speakmemo (monorepo root)
├── apps/                     # Consumer applications
│   ├── app/                  # SaaS application (port 3000)
│   └── web/                  # Landing page (port 3001) - planned
├── packages/                 # Shared libraries
│   ├── auth/                 # Better Auth configuration (server/client)
│   ├── database/             # Prisma ORM, schema, migrations
│   ├── storage/              # Supabase Storage client (new)
│   ├── ui/                   # Shared UI components, hooks, utils
│   ├── eslint-config/        # Shared ESLint rules
│   └── typescript-config/    # Shared TypeScript configuration
├── docs/                     # Documentation
└── CODEMAPS/                 # Architecture documentation (this directory)
```

## Package Dependency Graph

```
@speakmemo/app
├── @repo/auth ────────┐
├── @repo/database     │
├── @repo/storage      │
└── @repo/ui           │
                       │
@repo/auth ───────────┘
├── @repo/database
└── (Better Auth, Zod, env validation)

@repo/database
├── Prisma client (PostgreSQL)
└── (Schema: User, Session, Account, Verification, Note)

@repo/storage (NEW)
├── Supabase Storage client
└── (Recording upload/download/delete/URL management)

@repo/ui
├── Tailwind CSS v4
├── shadcn/ui components
└── (Shared hooks, utilities)
```

## Package Codemaps

| Package                                               | Purpose                         | Key Exports                                             | Status |
| ----------------------------------------------------- | ------------------------------- | ------------------------------------------------------- | ------ |
| **[@repo/auth](./AUTH.md)**                           | Better Auth server/client setup | `auth`, `client`, `sessionMiddleware`                   | Stable |
| **[@repo/database](./DATABASE.md)**                   | Prisma ORM, schema, migrations  | `database`, `Prisma`, types (User, Note, etc.)          | Active |
| **[@repo/storage](./STORAGE.md)**                     | Supabase file storage           | `uploadRecording`, `getRecordingUrl`, `deleteRecording` | NEW    |
| **[@repo/ui](./UI.md)**                               | Shared React components         | Components, hooks, utilities                            | Stable |
| **[@repo/eslint-config](./ESLINT_CONFIG.md)**         | ESLint flat config              | ESLint rules                                            | Stable |
| **[@repo/typescript-config](./TYPESCRIPT_CONFIG.md)** | TypeScript compiler options     | Base, Next.js, React configs                            | Stable |

## Application Codemaps

| App                            | Purpose               | Routes                   | Status  |
| ------------------------------ | --------------------- | ------------------------ | ------- |
| **[@speakmemo/app](./APP.md)** | Main SaaS application | `/`, `/app/*`            | Active  |
| **[@speakmemo/web](./WEB.md)** | Landing page          | `/`, `/pricing`, `/blog` | Planned |

---

## Tech Stack Summary

| Category  | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16, React 19             |
| Language  | TypeScript 5.7 (strict)          |
| Monorepo  | Turborepo 2.6, pnpm 10.4         |
| Styling   | Tailwind CSS v4, shadcn/ui       |
| Auth      | Better Auth 1.2 (Google OAuth)   |
| Database  | Prisma 6, PostgreSQL             |
| Storage   | Supabase Storage                 |
| STT       | OpenAI Whisper API               |
| LLM       | Claude Haiku (structuring)       |
| Testing   | Vitest                           |
| Linting   | ESLint 9 (flat config), Prettier |

---

## Key Concepts

### Authentication Flow

- Better Auth server configured in `@repo/auth`
- Session middleware validates requests
- Google OAuth integration
- User/Session/Account/Verification models

### Data Model

- **User**: Account holder
- **Session**: Active login state
- **Note**: Voice recording + transcript + structured data
  - States: `processing` → `transcribed` → `summarized` → (success/failed)
  - Contains: transcript, summary, key points, action items, tags, segments

### File Storage

- Audio recordings stored in Supabase Storage
- Path structure: `{userId}/{timestamp}.{ext}`
- Safe path validation (alphanumeric, underscore, hyphen only)
- Public URL generation for retrieval

---

## Recent Changes (Last 5 Commits)

1. **Consolidate tech stack docs** - Removed duplicate content across documentation
2. **Update next-env.d.ts imports** - Fixed route type import paths to dev directory
3. **Add branding & landing page docs** - Brand guidelines and landing page specs
4. **Day 1 storage code review** - Implementation review for storage package
5. **NEW: @repo/storage package** - Supabase Storage client for audio recording management

---

## Related Documentation

- [PRD](../prd.md) - Product requirements and MVP roadmap
- [Branding Guide](../branding.md) - Service naming, copy, tone, UI language
- [Landing Page Spec](../landing-page.md) - Landing page structure, content, SEO
- [README.md](../../README.md) - Getting started and development commands

---

## Development Quick Links

```bash
# Start development environment
docker compose up -d                                    # PostgreSQL
pnpm --filter @repo/database db:migrate:dev            # Migrations
pnpm dev                                               # All apps

# Common commands
pnpm lint                    # ESLint check
pnpm typecheck              # Type checking
pnpm format                 # Prettier format
pnpm --filter @repo/database db:studio  # Prisma Studio
```

---

See individual package codemaps for detailed architecture and API documentation.
