/**
 * Integration tests for GET /api/notes/:id/status
 *
 * Auth and database are mocked — no real I/O.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/notes/[id]/status/route";
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
const { database } = await import("@repo/database");

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockFindUnique = database.note.findUnique as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(noteId: string): NextRequest {
  return new NextRequest(`http://localhost/api/notes/${noteId}/status`, {
    method: "GET",
  });
}

function makeParams(id: string) {
  return Promise.resolve({ id });
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
describe("GET /api/notes/:id/status", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when the note is not found in the database", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue(null);
    const response = await GET(makeRequest("note-missing"), {
      params: makeParams("note-missing"),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when the note belongs to a different user", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue({
      id: "note-abc",
      userId: "user-2",
      status: "processing",
    });
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    expect(response.status).toBe(403);
  });

  it("returns 200 with { status } for the note owner", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue({
      id: "note-abc",
      userId: "user-1",
      status: "transcribed",
    });
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status", "transcribed");
  });

  it("returns all possible note statuses correctly", async () => {
    const statuses = [
      "processing",
      "transcribed",
      "summarized",
      "failed",
    ] as const;
    for (const status of statuses) {
      mockAuthedSession("user-1");
      mockFindUnique.mockResolvedValue({
        id: "note-abc",
        userId: "user-1",
        status,
      });
      const response = await GET(makeRequest("note-abc"), {
        params: makeParams("note-abc"),
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe(status);
    }
  });
});
