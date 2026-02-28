/**
 * Integration tests for GET /api/notes/:id
 *
 * Auth and database are mocked — no real I/O.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/notes/[id]/route";
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
  return new NextRequest(`http://localhost/api/notes/${noteId}`, {
    method: "GET",
  });
}

function makeParams(id: string) {
  return Promise.resolve({ id });
}

function mockAuthedSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({
    user: { id: userId },
    session: { id: "session-1" },
  });
}

const FULL_NOTE = {
  id: "note-abc",
  userId: "user-1",
  status: "summarized",
  transcript: "Hello world",
  summary: "Summary text",
  keyPoints: ["point 1"],
  actionItems: ["action 1"],
  tags: ["tag1"],
  recordingUrl: "recordings/user-1/1234.webm",
  durationSec: 42,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/notes/:id", () => {
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

  it("returns 404 when the note does not exist", async () => {
    mockAuthedSession();
    mockFindUnique.mockResolvedValue(null);
    const response = await GET(makeRequest("note-missing"), {
      params: makeParams("note-missing"),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when the note belongs to a different user", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue({ ...FULL_NOTE, userId: "user-2" });
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    expect(response.status).toBe(403);
  });

  it("returns 200 with the full note for the owner", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue(FULL_NOTE);
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("id", "note-abc");
    expect(body).toHaveProperty("status", "summarized");
    expect(body).toHaveProperty("transcript", "Hello world");
  });

  it("note response does not expose userId to the client", async () => {
    mockAuthedSession("user-1");
    mockFindUnique.mockResolvedValue(FULL_NOTE);
    const response = await GET(makeRequest("note-abc"), {
      params: makeParams("note-abc"),
    });
    const body = await response.json();
    expect(body).not.toHaveProperty("userId");
  });
});
