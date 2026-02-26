# Code Review: `6-feat-day-1` branch

- **Commits:** `efb6651` (add notes schema and @repo/storage), `5291d87` (docs update)
- **Files changed:** 24
- **Lines:** +726 / -5
- **Date:** 2026-02-26

---

## HIGH (4 issues) — resolve before merge

### 1. Anon key for server-side storage

- **Location:** `packages/storage/src/client.ts:11`
- **Description:** Supabase client uses `SUPABASE_ANON_KEY` for server-side operations. Without RLS configured on the `recordings` bucket, there is no row-level isolation between users. Either switch to service role key or configure RLS first.

```typescript
// CURRENT
createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { ... });

// OPTION A: service role key for server-side admin operations
createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { ... });

// OPTION B: keep anon key but configure RLS on the recordings bucket first
```

### 2. `getPublicUrl` for private recordings

- **Location:** `packages/storage/src/upload.ts:51-57`
- **Description:** Voice recordings are personal data but are served via public URLs. Anyone with the URL can access them unauthenticated. Switch to signed URLs with expiry.

```typescript
// PREFERRED: signed URL with expiry
const { data, error } = await supabase.storage
  .from(RECORDINGS_BUCKET)
  .createSignedUrl(path, 3600); // 1 hour
```

### 3. No `contentType` validation

- **Location:** `packages/storage/src/upload.ts:19,43`
- **Description:** `userId` and `fileExtension` are validated but `contentType` is passed through unchecked. A caller could supply `text/html`, enabling stored XSS if the bucket is publicly accessible. Add an allowlist of audio MIME types.

```typescript
const ALLOWED_AUDIO_CONTENT_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

if (!ALLOWED_AUDIO_CONTENT_TYPES.has(contentType)) {
  throw new Error(`Unsupported content type: ${contentType}`);
}
```

### 4. Path traversal on read/delete

- **Location:** `packages/storage/src/upload.ts:61,69,79`
- **Description:** `uploadRecording` validates inputs, but `deleteRecording`, `downloadRecording`, and `getRecordingUrl` accept a raw `path` string without validation. A crafted path like `../../admin/secret.wav` could access other files. Tests are also missing for this case.

```typescript
const SAFE_STORAGE_PATH = /^[a-zA-Z0-9_-]+\/\d+\.[a-zA-Z0-9]+$/;

function validateStoragePath(path: string): void {
  if (!SAFE_STORAGE_PATH.test(path)) {
    throw new Error("Invalid storage path format");
  }
}
```

---

## MEDIUM (3 issues)

### 5. No file size limit

- **Location:** `packages/storage/src/upload.ts:28-59`
- **Description:** No max size check before upload. Could exhaust Supabase Storage quota. Add a `MAX_RECORDING_SIZE_BYTES` guard.

### 6. No coverage config

- **Location:** `packages/storage/vitest.config.ts`
- **Description:** Project requires 80% coverage but vitest has no `coverage` block and `test` script has no `--coverage` flag.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### 7. Destructive migration warning

- **Location:** `packages/database/prisma/schema/migrations/20260225171743_add_note_status_enum/migration.sql:1-5`
- **Description:** Prisma warns `status` column will be dropped and recreated (data loss). Acceptable in dev, but should be acknowledged with a comment.

---

## LOW (2 notes)

### 8. Raw `.ts` exports

- **Location:** `packages/storage/package.json:24-29`
- **Description:** Exports point to source `.ts` files directly. Fine for this monorepo's `transpilePackages` setup, but limits reuse outside Next.js.

### 9. Empty turbo tasks

- **Location:** `packages/storage/turbo.json`
- **Description:** No `test` task defined; caching may behave unexpectedly since the package has no `build` script but root declares `dependsOn: ["^build"]`.

---

## Summary

| Severity | Count | Status |
| -------- | ----- | ------ |
| CRITICAL | 0     | pass   |
| HIGH     | 4     | warn   |
| MEDIUM   | 3     | info   |
| LOW      | 2     | note   |

**Verdict: WARN** — 4 HIGH issues should be resolved before merge.

**Priority order for fixes:**

1. Decide auth model (service role key vs. anon key + RLS)
2. Switch to signed URLs for recordings privacy
3. Add `contentType` allowlist
4. Add path validation to `delete`/`download`/`getRecordingUrl`
