# App (@speakmemo/app) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/auth/[...all]/route.ts`

## Architecture

```
@speakmemo/app (SaaS application)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page (redirects to /home)
│   │   ├── (public)/         # Public routes (no auth required)
│   │   │   ├── sign-in/      # Google OAuth login page
│   │   │   └── layout.tsx    # Public layout
│   │   ├── (authenticated)/ # Protected routes (auth required)
│   │   │   ├── (standard)/   # Standard layout
│   │   │   │   ├── home/     # Main dashboard
│   │   │   │   ├── about/    # About page
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx    # Auth check, redirect
│   │   └── api/
│   │       └── auth/[...all]/route.ts  # Better Auth handler
│   ├── components/           # React components
│   │   └── [component files]
│   ├── types/               # TypeScript types
│   ├── styles/              # CSS files
│   └── proxy.ts             # rsc_enabled helper
├── next.config.ts           # Next.js config
├── package.json
└── tsconfig.json

External:
├── Next.js 16 (framework)
├── @repo/auth (Better Auth)
├── @repo/database (Prisma)
├── @repo/storage (Supabase)
└── @repo/ui (Components)
```

## Route Structure

### Public Routes (Unauthenticated)

**GET `/`**

- Redirects to `/home` (or `/sign-in` if not authenticated)
- Route: `src/app/page.tsx`

**GET `/sign-in`**

- Google OAuth login page
- Route: `src/app/(public)/sign-in/page.tsx`
- Components: Google Sign-In button
- Status: Implemented

**Layout:** `src/app/(public)/layout.tsx`

---

### Authenticated Routes (Protected)

**GET `/home`**

- Main dashboard / recording list
- Route: `src/app/(authenticated)/(standard)/home/page.tsx`
- Components: Recording interface, note list, recording button
- Status: Implemented
- Requires: Valid session

**GET `/about`**

- About page (authenticated section)
- Route: `src/app/(authenticated)/(standard)/about/page.tsx`
- Status: Implemented
- Requires: Valid session

**Layout Hierarchy:**

```
(authenticated)/layout.tsx
  └─ Auth guard, redirect to /sign-in if no session
  └─ (standard)/layout.tsx
      ├─ home/page.tsx
      ├─ about/page.tsx
      └─ ... [future pages]
```

---

### API Routes

**POST/GET `/api/auth/[...all]`**

- Better Auth catch-all handler
- Route: `src/app/api/auth/[...all]/route.ts`
- Endpoints:
  - `POST /api/auth/sign-in/google` - Initiate Google OAuth
  - `POST /api/auth/callback/google` - OAuth callback
  - `POST /api/auth/sign-out` - Logout
  - `GET /api/auth/session` - Get current session
- Status: Implemented
- Requires: SESSION/auth setup

---

## Authentication Flow

```
1. Unauthenticated User
   └─→ Visits "/"
       └─→ Redirected to "/sign-in" (via middleware)

2. Sign-In Page
   └─→ Clicks "Sign in with Google"
       └─→ POST /api/auth/sign-in/google
           ├─ Initiates OAuth flow
           └─→ Redirects to Google consent screen

3. Google Consent
   └─→ User authorizes "speakmemo"
       └─→ Google redirects to callback
           └─→ Backend exchanges code for tokens

4. Session Created
   └─→ Session stored in database
       └─→ Session cookie/token set in browser
           └─→ User redirected to "/home"

5. Home Page (Authenticated)
   └─→ (authenticated)/layout checks session
       └─→ If valid, renders /home dashboard
       └─→ If invalid, redirects to /sign-in

6. Sign Out
   └─→ POST /api/auth/sign-out
       └─→ Invalidates session in database
           └─→ Redirects to "/sign-in"
```

## Layouts

### Root Layout (`src/app/layout.tsx`)

- Initializes Tailwind, fonts, global styles
- Sets up theme provider (dark mode)
- Wraps all child pages

**Includes:**

- Global CSS from `@repo/ui/globals.css`
- Font setup (Pretendard Variable)
- NextThemes provider
- HTML/body structure

---

### Public Layout (`src/app/(public)/layout.tsx`)

- No authentication check
- Public pages (sign-in, about, etc.)
- May include footer, minimal nav

---

### Authenticated Layout (`src/app/(authenticated)/layout.tsx`)

- **Middleware-like check:** Redirects to /sign-in if no session
- Wraps all protected routes
- Sets up authenticated context

```typescript
// src/app/(authenticated)/layout.tsx (pseudo-code)
export default async function AuthenticatedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return <>{children}</>;
}
```

---

### Standard Layout (`src/app/(authenticated)/(standard)/layout.tsx`)

- Layout for authenticated pages (home, about, etc.)
- Navigation header, sidebar, etc.
- Consistent UI for the SaaS app

---

## Components

Located in `src/components/`:

**Examples:**

- `RecordingButton.tsx` - Audio recording control
- `NoteList.tsx` - Lists user's notes
- `AuthProvider.tsx` - Session context provider
- `Header.tsx` - Navigation header
- `Sidebar.tsx` - Sidebar navigation

(Detailed component list in project repository)

## Data Fetching

### Server Components

```typescript
// src/app/(authenticated)/(standard)/home/page.tsx

export default async function HomePage() {
  const session = await getSession();
  const notes = await database.note.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <NoteList notes={notes} />;
}
```

- Uses `await` directly
- Fetches from database on server
- No waterfall requests
- Cached per request

### Recording Upload

```typescript
// Server Action
"use server";

export async function uploadRecording(file: File) {
  const session = await getSession();

  const { path, publicUrl } = await uploadRecording({
    userId: session.user.id,
    file,
    contentType: "audio/webm",
    fileExtension: "webm",
  });

  // Create note record
  const note = await database.note.create({
    data: {
      userId: session.user.id,
      recordingUrl: path,
      status: "processing",
    },
  });

  return { noteId: note.id, recordingUrl };
}
```

- Handles file upload to Supabase
- Creates database record
- Server-side only (security)

## Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
AUTH_SECRET=<secret>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>

# Database
DATABASE_URL=postgresql://...

# Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
```

**Public variables** (prefixed `NEXT_PUBLIC_`) available in browser.

## Configuration Files

### `next.config.ts`

- Monorepo transpilation: `@repo/ui`, `@repo/database`, `@repo/auth`
- Tailwind configuration
- Image optimization
- TypeScript strict mode

### `tsconfig.json`

- Extends `@repo/typescript-config/nextjs.json`
- Path aliases: `@/*` → `./src/*`
- Strict mode enabled

### ESLint

- Uses `@repo/eslint-config/next.js`
- Flat config format
- Auto-fix on save

## Build & Deployment

```bash
# Development
pnpm dev                    # Port 3000

# Production build
pnpm build                  # Compiles to .next/
pnpm start                  # Runs server

# With migrations
pnpm build:deploy          # Runs migrations, then builds
```

**Deployment:** Vercel (supports Next.js natively)

## External Dependencies

| Package        | Version   | Purpose         |
| -------------- | --------- | --------------- |
| next           | ^16.1.6   | Framework       |
| react          | ^19.2.3   | UI library      |
| @repo/auth     | workspace | Authentication  |
| @repo/database | workspace | Database client |
| @repo/storage  | workspace | File storage    |
| @repo/ui       | workspace | Components      |
| better-auth    | ^1.2.0    | OAuth           |
| next-themes    | ^0.4.6    | Dark mode       |

## Related Areas

- **[@repo/auth](./AUTH.md)** - Session management, OAuth
- **[@repo/database](./DATABASE.md)** - Note CRUD, user queries
- **[@repo/storage](./STORAGE.md)** - Recording upload/download
- **[@repo/ui](./UI.md)** - Components, styles, hooks

---

## Implementation Notes

1. **Route Groups:** `(public)`, `(authenticated)`, `(standard)` for layout organization
2. **Server Components:** Default in App Router (faster, secure data access)
3. **Middleware:** Better Auth handles session validation
4. **Streaming:** Supported for progressive rendering
5. **ISR/Revalidation:** Can cache pages with `revalidate` option

---

Status: **Active** - Core SaaS application, recording feature in progress
