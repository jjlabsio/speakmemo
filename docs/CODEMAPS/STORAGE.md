# Storage (@repo/storage) Codemap

**Last Updated:** 2026-02-28
**Entry Points:** `src/index.ts`, `src/upload.ts`, `src/client.ts`

## Architecture

```
@repo/storage
├── client.ts
│   └── Supabase client (singleton, global instance)
├── keys.ts
│   └── Environment variable schema (Zod validation)
├── upload.ts
│   ├── uploadRecording()       [server-only]
│   ├── getRecordingUrl()       [sync]
│   ├── deleteRecording()       [server-only]
│   └── downloadRecording()     [server-only]
└── index.ts
    └── Public API exports

External:
├── Supabase (@supabase/supabase-js)
│   └── .storage.from("recordings") bucket
└── Node.js (server-only constraint)
```

## Key Modules

| Module        | Purpose                                | Exports                                                                      | Dependencies                  |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------- |
| **client.ts** | Supabase Storage client initialization | `supabase` (SupabaseClient)                                                  | @supabase/supabase-js, ./keys |
| **keys.ts**   | Environment variable validation        | `env` (validated object)                                                     | zod, @t3-oss/env-nextjs       |
| **upload.ts** | Recording file operations              | `uploadRecording`, `getRecordingUrl`, `deleteRecording`, `downloadRecording` | ./client, server-only         |
| **index.ts**  | Public API                             | Re-exports all upload functions                                              | ./upload                      |

## API Reference

### `uploadRecording(params: UploadRecordingParams): Promise<UploadRecordingResult>`

Uploads audio recording to Supabase Storage.

**Parameters:**

```typescript
{
  userId: string; // Alphanumeric, underscore, hyphen only
  file: File | Blob; // Binary file data
  contentType: string; // MIME type (e.g., "audio/webm")
  fileExtension: string; // Extension without dot (e.g., "webm")
}
```

**Returns:**

```typescript
{
  path: string; // "{userId}/{timestamp}.{ext}"
  publicUrl: string; // Signed public URL for retrieval
}
```

**Errors:** Throws if path validation fails or upload fails.

**Server-only:** Yes (uses `"server-only"` module guard)

---

### `getRecordingUrl(path: string): string`

Retrieves public URL for stored recording.

**Parameters:**

- `path: string` - Storage path from `uploadRecording()` result

**Returns:** Signed public URL string

**Errors:** None (returns URL regardless of existence)

**Server-only:** Yes

---

### `deleteRecording(path: string): Promise<void>`

Removes recording from storage.

**Parameters:**

- `path: string` - Storage path to delete

**Errors:** Throws if deletion fails

**Server-only:** Yes

---

### `downloadRecording(path: string): Promise<Blob>`

Downloads recording file content.

**Parameters:**

- `path: string` - Storage path to download

**Returns:** Blob with file binary data

**Errors:** Throws if download fails

**Server-only:** Yes

---

## Data Flow

```
Client (React Component)
    │
    ├─ (optional) Recording audio stream
    │
    └─→ Server Action / API Route
            │
            └─→ uploadRecording()
                    │
                    ├─ Validate userId & fileExtension
                    │
                    ├─ Generate path: {userId}/{timestamp}.{ext}
                    │
                    └─→ supabase.storage.from("recordings").upload()
                            │
                            ├─ Success → return { path, publicUrl }
                            │
                            └─ Error → throw Error

Later:
    ├─ getRecordingUrl(path)           → public URL (for playback)
    ├─ downloadRecording(path)         → Blob (for processing)
    └─ deleteRecording(path)           → void (cleanup)
```

## Storage Structure

**Bucket:** `recordings` (configured in Supabase project)

**Path Pattern:** `{userId}/{timestamp}.{fileExtension}`

Example paths:

- `user_abc123/1735180800000.webm`
- `user_xyz789/1735180900000.m4a`

**Safety Constraints:**

- Path segments validated against `/^[a-zA-Z0-9_-]+$/`
- Only alphanumeric, underscore, hyphen characters allowed
- Prevents directory traversal, special characters

## Environment Configuration

```typescript
// .env (required)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Validated via `zod` schema in `keys.ts`:

- Both variables required (non-empty strings)
- Fails fast at module load if missing

## External Dependencies

- **@supabase/supabase-js** ^2.49.0 - Storage client, SDK
- **@t3-oss/env-nextjs** ^0.11.1 - Environment variable validation
- **zod** ^3.25.76 - Schema validation
- **server-only** ^0.0.1 - Runtime guard against client-side imports

## Testing

Location: `__tests__/`

Test files:

- `client.test.ts` - Supabase client initialization
- `keys.test.ts` - Environment variable schema
- `upload.test.ts` - Upload, download, delete, URL operations

Run tests:

```bash
pnpm test
```

## Export Formats

```json
{
  ".": "./src/index.ts",
  "./client": "./src/client.ts",
  "./keys": "./src/keys.ts",
  "./upload": "./src/upload.ts"
}
```

Usage:

```typescript
// Default export (upload functions)
import { uploadRecording } from "@repo/storage";

// Named exports
import { uploadRecording, getRecordingUrl } from "@repo/storage/upload";
import { supabase } from "@repo/storage/client";
import { env } from "@repo/storage/keys";
```

## Related Areas

- **[@repo/database](./DATABASE.md)** - Note model stores `recordingUrl`
- **[@speakmemo/app](./APP.md)** - Uses storage in recording endpoints
- **Authentication** - Recording paths scoped to userId from session

---

## Implementation Notes

1. **Singleton Pattern:** Supabase client created once and reused globally (with hot-module-replacement support in dev)
2. **Server-Only Guard:** All functions marked with `"server-only"` to prevent accidental client-side imports
3. **Error Handling:** Detailed error messages on failure (upload, delete, download)
4. **Path Safety:** Strict validation prevents path traversal attacks
5. **Content Type:** Explicitly specified on upload for proper MIME type handling
6. **Upsert Disabled:** `upsert: false` means duplicate uploads fail (prevents accidental overwrites)

---

Status: **NEW** - Added in commit a2e9b24 as part of Day 1 implementation
