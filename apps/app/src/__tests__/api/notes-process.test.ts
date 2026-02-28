/**
 * Integration tests for POST /api/notes/process
 *
 * Tests use mocked auth session, database, storage, and Whisper client —
 * no real I/O.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/notes/process/route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("server-only", () => ({}));

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
      update: vi.fn(),
    },
  },
}));

vi.mock("@repo/storage", () => ({
  downloadRecording: vi.fn(),
}));

vi.mock("@/lib/whisper", () => ({
  transcribeAudio: vi.fn(),
}));

const { auth } = await import("@repo/auth");
const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

const { database } = await import("@repo/database");
const mockFindUnique = database.note.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = database.note.update as ReturnType<typeof vi.fn>;

const { downloadRecording } = await import("@repo/storage");
const mockDownloadRecording = downloadRecording as ReturnType<typeof vi.fn>;

const { transcribeAudio } = await import("@/lib/whisper");
const mockTranscribeAudio = transcribeAudio as ReturnType<typeof vi.fn>;

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

const FAKE_BLOB = new Blob(["audio-data"], { type: "audio/webm" });
const FAKE_TRANSCRIPTION = {
  text: "테스트 전사 결과",
  segments: [{ start: 0, end: 3.5, text: "테스트 전사 결과" }],
  durationSec: 3.5,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/notes/process", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockDownloadRecording.mockReset();
    mockTranscribeAudio.mockReset();
  });

  // -------------------------------------------------------------------------
  // Existing tests (must keep passing)
  // -------------------------------------------------------------------------
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
    mockFindUnique.mockResolvedValue({
      userId: "user-456",
      recordingUrl: null,
    });
    const request = makeRequest({ note_id: "note-others" });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  // -------------------------------------------------------------------------
  // Updated existing test: now expects { noteId, status: "transcribed" }
  // -------------------------------------------------------------------------
  it("returns 200 with { noteId, status: 'transcribed' } on successful transcription", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: "user-123/1234567890.webm",
    });
    mockDownloadRecording.mockResolvedValue(FAKE_BLOB);
    mockTranscribeAudio.mockResolvedValue(FAKE_TRANSCRIPTION);
    mockUpdate.mockResolvedValue({});

    const request = makeRequest({ note_id: "note-xyz" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ noteId: "note-xyz", status: "transcribed" });
  });

  // -------------------------------------------------------------------------
  // New STT pipeline tests
  // -------------------------------------------------------------------------
  it("returns 400 when note has no recordingUrl", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: null,
    });
    const request = makeRequest({ note_id: "note-no-url" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 500 and sets note status to 'failed' when download fails", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: "user-123/1234567890.webm",
    });
    mockDownloadRecording.mockRejectedValue(new Error("Storage unavailable"));
    mockUpdate.mockResolvedValue({});

    const request = makeRequest({ note_id: "note-dl-fail" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "note-dl-fail" },
        data: expect.objectContaining({ status: "failed" }),
      }),
    );
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("noteId", "note-dl-fail");
  });

  it("returns 500 and sets note status to 'failed' when Whisper API fails", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: "user-123/1234567890.webm",
    });
    mockDownloadRecording.mockResolvedValue(FAKE_BLOB);
    mockTranscribeAudio.mockRejectedValue(new Error("Whisper service error"));
    mockUpdate.mockResolvedValue({});

    const request = makeRequest({ note_id: "note-stt-fail" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "note-stt-fail" },
        data: expect.objectContaining({ status: "failed" }),
      }),
    );
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("noteId", "note-stt-fail");
  });

  it("updates note with transcript, segments, durationSec, and status 'transcribed' on success", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: "user-123/1234567890.webm",
    });
    mockDownloadRecording.mockResolvedValue(FAKE_BLOB);
    mockTranscribeAudio.mockResolvedValue(FAKE_TRANSCRIPTION);
    mockUpdate.mockResolvedValue({});

    const request = makeRequest({ note_id: "note-success" });
    await POST(request);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "note-success" },
        data: expect.objectContaining({
          transcript: FAKE_TRANSCRIPTION.text,
          segments: FAKE_TRANSCRIPTION.segments,
          durationSec: FAKE_TRANSCRIPTION.durationSec,
          status: "transcribed",
        }),
      }),
    );
  });

  it("passes correct filename (derived from recordingUrl) to transcribeAudio", async () => {
    mockAuthedSession("user-123");
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      recordingUrl: "user-123/1234567890.webm",
    });
    mockDownloadRecording.mockResolvedValue(FAKE_BLOB);
    mockTranscribeAudio.mockResolvedValue(FAKE_TRANSCRIPTION);
    mockUpdate.mockResolvedValue({});

    const request = makeRequest({ note_id: "note-filename" });
    await POST(request);

    const [, filenameArg] = mockTranscribeAudio.mock.calls[0] as [Blob, string];
    expect(filenameArg).toBe("1234567890.webm");
  });
});
