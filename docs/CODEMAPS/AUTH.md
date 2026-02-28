# Auth (@repo/auth) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `src/index.ts`, `src/server.ts`, `src/client.ts`

## Architecture

```
@repo/auth
├── src/
│   ├── server.ts
│   │   └── Better Auth server config (session middleware, adapters)
│   ├── client.ts
│   │   └── Client-side auth client (session management)
│   ├── keys.ts
│   │   └── Environment variable schema (OAuth credentials, secrets)
│   └── index.ts
│       └── Public API exports
└── package.json

External:
├── Better Auth v1.2 (OAuth server)
├── @repo/database (User model, Prisma adapter)
├── Google OAuth provider
└── Node.js/Browser runtime (server/client)
```

## Key Modules

| Module        | Purpose                                  | Exports                                     | Dependencies                        |
| ------------- | ---------------------------------------- | ------------------------------------------- | ----------------------------------- |
| **server.ts** | Auth server instance, session middleware | `auth`, `sessionMiddleware`                 | better-auth, @repo/database, ./keys |
| **client.ts** | Client-side auth client                  | `authClient`                                | better-auth/client                  |
| **keys.ts**   | Environment variable validation          | `env` (AUTH_SECRET, GOOGLE_CLIENT_ID, etc.) | zod, @t3-oss/env-nextjs             |
| **index.ts**  | Public API                               | Exports server, client, middleware          | ./server, ./client                  |

## Authentication Flow

```
1. User visits app
   └─→ Middleware checks session

2. No session → Redirect to login
   └─→ Google OAuth flow initiated
       ├─ Request authorization from Google
       ├─ User authenticates
       └─ Callback receives authorization code

3. Backend exchanges code for tokens
   └─→ Creates Account record (OAuth credentials)
       └─→ Links to User (or creates new User)

4. Session created
   └─→ Session cookie/token stored
       └─→ User logged in, middleware allows access

5. User logged in
   └─→ Session attached to requests
       └─→ User ID available in server context
```

## Server-Side API

```typescript
import { auth, sessionMiddleware } from "@repo/auth";

// In server action or API route:
const session = await auth.api.getSession({ headers });
// → { user: { id, email, name, image }, session: { ... } }

// Middleware usage:
export const middleware = sessionMiddleware;
```

**session object:**

```typescript
{
  user: {
    id: string              // CUID, from User model
    email: string
    name?: string
    image?: string
  },
  session: {
    token: string
    expiresAt: number
  }
}
```

## Client-Side API

```typescript
import { authClient } from "@repo/auth/client";

// Check current session
const { data: session } = await authClient.getSession();
// → { user: { ... }, session: { ... } }

// Sign in (triggers Google OAuth)
await authClient.signIn.social({ provider: "google" });

// Sign out
await authClient.signOut();
```

## Supported OAuth Providers

- **Google** (primary, configured)
  - Requires: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Scopes: Email, profile

## Environment Configuration

```bash
# .env (required)
AUTH_SECRET=<random-secret-min-32-chars>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# Optional
GOOGLE_SCOPES=openid,profile,email
BETTER_AUTH_TRUST_HOST=true  # for localhost development
```

**Secret Generation:**

```bash
openssl rand -base64 32
```

## Session Management

**Better Auth handles:**

- Session creation after successful OAuth flow
- Token validation on each request
- Automatic token refresh (if configured)
- Session expiration cleanup

**Session Storage:**

- Token stored in database `Session` table
- Linked to `User` record
- Includes `expiresAt` timestamp

## Database Integration

**Prisma Adapter:** Better Auth uses Prisma to manage:

- `User` - Account info
- `Session` - Active logins
- `Account` - OAuth credentials (Google)
- `Verification` - Email verification tokens

**Models automatically synced** with Better Auth lifecycle.

## Security Features

1. **CSRF Protection:** Built-in token validation
2. **Session Security:** Encrypted tokens, HTTP-only cookies
3. **OAuth Verification:** Code validation, state parameter
4. **Secret Rotation:** Token refresh support
5. **Cascade Delete:** User deletion removes sessions, accounts, verifications

## Export API

```typescript
// Server-side
import { auth, sessionMiddleware } from "@repo/auth";
import type { Session } from "@repo/auth";

// Client-side
import { authClient } from "@repo/auth/client";

// Environment
import { env } from "@repo/auth/keys";
```

## Middleware Integration

```typescript
// Next.js middleware.ts
import { sessionMiddleware } from "@repo/auth";

export const middleware = sessionMiddleware;

export const config = {
  matcher: [
    "/api/(.*)",
    "/app/(.*)",
    // Protect authenticated routes
  ],
};
```

**Middleware flow:**

1. Extract session token from request
2. Validate token against database
3. Attach user/session to request context
4. Pass to route handler

## Related Areas

- **[@repo/database](./DATABASE.md)** - User, Session, Account, Verification models
- **[@speakmemo/app](./APP.md)** - Uses auth middleware, session in pages
- **OAuth Providers** - Google Cloud Console for credentials

---

## Implementation Notes

1. **Better Auth v1.2:** Production-ready OAuth server with Prisma support
2. **Prisma Adapter:** Automatically creates/updates User, Session, Account on auth events
3. **Server-Only:** Auth server logic runs only on Node.js backend
4. **Session Validation:** Checked on every protected route
5. **Logout:** Invalidates session token in database

---

Status: **Stable** - Core authentication infrastructure, no recent changes needed
