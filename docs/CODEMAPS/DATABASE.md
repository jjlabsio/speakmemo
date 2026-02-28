# Database (@repo/database) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `src/index.ts`, `prisma/schema/` (Prisma models)

## Architecture

```
@repo/database
├── src/
│   ├── client.ts
│   │   └── Prisma client (singleton)
│   ├── keys.ts
│   │   └── Environment variable schema
│   └── index.ts
│       └── Public API exports
├── prisma/
│   ├── schema.prisma        (root schema)
│   ├── schema/
│   │   ├── user.prisma
│   │   └── note.prisma      (NEW)
│   └── migrations/
│       └── (database versions)
└── package.json

External:
├── PostgreSQL database
├── Prisma ORM (@prisma/client)
└── node_modules/.prisma/client/ (generated code)
```

## Key Modules

| Module             | Purpose                      | Exports                                    | Dependencies            |
| ------------------ | ---------------------------- | ------------------------------------------ | ----------------------- |
| **client.ts**      | Prisma client initialization | `database` (PrismaClient instance)         | @prisma/client, ./keys  |
| **keys.ts**        | Environment validation       | `env` (DATABASE_URL)                       | zod, @t3-oss/env-nextjs |
| **index.ts**       | Public API                   | `database`, `Prisma`, types                | @prisma/client          |
| **prisma/schema/** | Data models                  | User, Session, Account, Verification, Note | Prisma schema           |

## Data Models

### User

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions      Session[]
  accounts      Account[]
  verifications Verification[]
  notes         Note[]          // NEW: User's notes
}
```

**Purpose:** Account holder information
**Primary Key:** `id` (CUID)
**Indexes:** `email` (unique)

---

### Session

```prisma
model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Purpose:** Active login state tracking
**Primary Key:** `id`
**Relationships:** References `User` (Cascade delete)
**Indexes:** `token` (unique), implicitly `userId`

---

### Account

```prisma
model Account {
  id              String  @id @default(cuid())
  accountId       String
  providerId      String
  accessToken     String?
  refreshToken    String?
  accessTokenExpiresAt DateTime?
  password        String?
  userId          String
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, providerId, accountId])
}
```

**Purpose:** OAuth provider credentials (Google, etc.)
**Primary Key:** `id`
**Relationships:** References `User` (Cascade delete)
**Indexes:** Composite unique on `(userId, providerId, accountId)`

---

### Verification

```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([identifier, value])
}
```

**Purpose:** Email/OTP verification tokens
**Primary Key:** `id`
**Relationships:** Optional reference to `User` (Cascade delete)
**Indexes:** Composite unique on `(identifier, value)`

---

### Note (NEW)

```prisma
enum NoteStatus {
  processing    // Recording uploaded, transcription pending
  transcribed   // Whisper transcript complete
  summarized    // LLM structuring complete
  failed        // Processing failed at any stage
}

model Note {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status       NoteStatus @default(processing)
  recordingUrl String?    // Path in Supabase Storage
  durationSec  Int?       // Audio duration in seconds
  transcript   String?    // Raw Whisper output
  summary      String?    // LLM-generated summary
  keyPoints    Json?      // Array of key points
  actionItems  Json?      // Array of action items
  tags         Json?      // Array of tags/categories
  segments     Json?      // Transcript segments with timestamps
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([userId, createdAt(sort: Desc)])
}
```

**Purpose:** Voice recording + transcript + structured data
**Primary Key:** `id` (CUID)
**Status Flow:** `processing` → `transcribed` → `summarized` → (success or `failed`)
**Relationships:** References `User` (Cascade delete)
**Indexes:** Composite on `(userId, createdAt DESC)` for efficient recent-notes queries

---

## Data Flow

```
Note Lifecycle:

1. User records audio
   └─→ uploadRecording() → Supabase Storage
       └─→ noteId created, status = "processing", recordingUrl set

2. Background job: Whisper API
   └─→ Transcribe audio file
       └─→ Update note: transcript, status = "transcribed"

3. Background job: Claude API
   └─→ Extract summary, keyPoints, actionItems
       └─→ Update note: summary, keyPoints, actionItems, status = "summarized"

4. User views note (completed)
   └─→ Fetch note with all fields populated

If any step fails:
   └─→ status = "failed", error logged
```

## Export API

```typescript
// From @repo/database

// 1. Client instance
import { database } from "@repo/database";

// 2. Types
import type { User, Session, Note, NoteStatus } from "@repo/database";

// 3. Prisma namespace (for advanced queries)
import { Prisma } from "@repo/database";

// Example usage:
const note = await database.note.create({
  data: {
    userId,
    recordingUrl: "user_abc/1735180800000.webm",
    status: "processing",
  },
});

const userNotes = await database.note.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
});
```

## External Dependencies

- **@prisma/client** ^6.0.0 - ORM library
- **@t3-oss/env-nextjs** ^0.11.1 - Environment validation
- **zod** ^3.25.76 - Schema validation

## Environment Configuration

```bash
# .env (required)
DATABASE_URL=postgresql://user:password@localhost:5432/speakmemo
```

## Development Commands

```bash
# Create new migration
pnpm --filter @repo/database db:migrate:dev --name add_notes_table

# Apply pending migrations
pnpm --filter @repo/database db:migrate:deploy

# Open Prisma Studio (web GUI)
pnpm --filter @repo/database db:studio

# Generate Prisma client
pnpm --filter @repo/database db:generate
```

## Migrations

**Recent migrations:**

- `20260225164959_add_notes_table` - Created notes table with NoteStatus enum
- `20260225171743_add_note_status_enum` - Refined NoteStatus enum values

All migrations tracked in `prisma/migrations/` with timestamps.

## Related Areas

- **[@repo/auth](./AUTH.md)** - Uses User, Session, Account, Verification
- **[@repo/storage](./STORAGE.md)** - Note.recordingUrl points to Supabase path
- **[@speakmemo/app](./APP.md)** - CRUD operations via database client

---

## Implementation Notes

1. **Singleton Client:** Prisma client created once per server process, reused globally
2. **Cascade Delete:** Deleting User cascade-deletes Sessions, Accounts, Verifications, Notes
3. **Composite Indexes:** Note index on `(userId, createdAt DESC)` optimizes user's recent notes query
4. **JSON Fields:** `keyPoints`, `actionItems`, `tags`, `segments` stored as JSON (flexible structure)
5. **Default Values:** Note.status defaults to "processing" (safe default)
6. **Soft Schema:** Note fields nullable to support multi-step processing pipeline

---

Status: **Active** - Recently updated with Note model (commits 20260225)
