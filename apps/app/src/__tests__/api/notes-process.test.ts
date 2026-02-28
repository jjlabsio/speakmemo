/**
 * Integration tests for POST /api/notes/process
 *
 * Tests use mocked auth session and database — no real I/O.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/notes/process/route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@repo/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@repo/database", () => ({
  database: {
    note: {
      findUnique: vi.fn(),
    },
  },
}));

const { auth } = await import("@repo/auth");
const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

const { database } = await import("@repo/database");
const mockFindUnique = database.note.findUnique as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/notes/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuthedSession(userId = "user-123") {
  mockGetSession.mockResolvedValue({
    user: { id: userId },
    session: { id: "session-1" },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/notes/process", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns 401 when session is missing", async () => {
    mockGetSession.mockResolvedValue(null);
    const request = makeRequest({ note_id: "note-abc" });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when note_id is missing from body", async () => {
    mockAuthedSession();
    const request = makeRequest({});
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when note_id is an empty string", async () => {
    mockAuthedSession();
    const request = makeRequest({ note_id: "" });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 404 when the note does not exist", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue(null);
    const request = makeRequest({ note_id: "note-missing" });
    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("returns 403 when the note belongs to a different user", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({ userId: "user-456" });
    const request = makeRequest({ note_id: "note-others" });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 200 with { noteId } when the note belongs to the authenticated user", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({ userId: "user-123" });
    const request = makeRequest({ note_id: "note-xyz" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("noteId", "note-xyz");
  });

  it("response body contains only noteId (no sensitive data)", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({ userId: "user-123" });
    const request = makeRequest({ note_id: "note-xyz" });
    const response = await POST(request);
    const body = await response.json();
    expect(Object.keys(body)).toEqual(["noteId"]);
  });
});
