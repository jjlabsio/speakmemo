/**
 * Tests for home/actions.ts Server Action: uploadAndCreateNote
 *
 * Both the auth session, Supabase storage, and database client are fully
 * mocked — no real network or DB calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadAndCreateNote } from "@/app/(authenticated)/(standard)/home/actions";

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

vi.mock("@repo/storage", () => ({
  uploadRecording: vi.fn(),
  deleteRecording: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    note: {
      create: vi.fn(),
    },
  },
}));

// Server action imports next/headers — mock it
vi.mock("next/headers", () => ({
  headers: vi.fn().mockReturnValue(new Headers()),
}));

// ---------------------------------------------------------------------------
// Import mocked modules for assertion
// ---------------------------------------------------------------------------
const { auth } = await import("@repo/auth");
const { uploadRecording, deleteRecording } = await import("@repo/storage");
const { database } = await import("@repo/database");

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockUploadRecording = uploadRecording as ReturnType<typeof vi.fn>;
const mockDeleteRecording = deleteRecording as ReturnType<typeof vi.fn>;
const mockNoteCreate = database.note.create as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("recording", file);
  return fd;
}

function makeAudioFile(name = "recording.webm", size = 1024): File {
  const blob = new Blob([new Uint8Array(size)], { type: "audio/webm" });
  return new File([blob], name, { type: "audio/webm" });
}

function mockAuthedSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({
    user: { id: userId, name: "Test User" },
    session: { id: "session-1" },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("uploadAndCreateNote", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockUploadRecording.mockReset();
    mockDeleteRecording.mockReset();
    mockNoteCreate.mockReset();
  });

  it("throws an error when no session is found (unauthenticated)", async () => {
    mockGetSession.mockResolvedValue(null);
    const formData = makeFormData(makeAudioFile());

    await expect(uploadAndCreateNote(formData)).rejects.toThrow();
  });

  it("throws when the 'recording' field is missing from FormData", async () => {
    mockAuthedSession();
    const fd = new FormData();

    await expect(uploadAndCreateNote(fd)).rejects.toThrow();
  });

  it("calls uploadRecording with the userId and file from FormData", async () => {
    mockAuthedSession("user-abc");
    const file = makeAudioFile("test.webm");
    mockUploadRecording.mockResolvedValue({
      path: "user-abc/1234.webm",
      publicUrl: "https://cdn.example.com/user-abc/1234.webm",
    });
    mockNoteCreate.mockResolvedValue({ id: "note-1", status: "processing" });

    await uploadAndCreateNote(makeFormData(file));

    expect(mockUploadRecording).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-abc",
        file: expect.any(File),
      }),
    );
  });

  it("creates a Note record in the database with status 'processing'", async () => {
    mockAuthedSession("user-1");
    const file = makeAudioFile();
    mockUploadRecording.mockResolvedValue({
      path: "user-1/1234.webm",
      publicUrl: "https://cdn.example.com/user-1/1234.webm",
    });
    mockNoteCreate.mockResolvedValue({ id: "note-new", status: "processing" });

    await uploadAndCreateNote(makeFormData(file));

    expect(mockNoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          status: "processing",
        }),
      }),
    );
  });

  it("returns an object with noteId from the created note", async () => {
    mockAuthedSession("user-1");
    mockUploadRecording.mockResolvedValue({
      path: "user-1/1234.webm",
      publicUrl: "https://cdn.example.com/user-1/1234.webm",
    });
    mockNoteCreate.mockResolvedValue({ id: "note-42", status: "processing" });

    const result = await uploadAndCreateNote(makeFormData(makeAudioFile()));

    expect(result).toHaveProperty("noteId", "note-42");
  });

  it("propagates storage upload errors", async () => {
    mockAuthedSession("user-1");
    mockUploadRecording.mockRejectedValue(new Error("Storage quota exceeded"));

    await expect(
      uploadAndCreateNote(makeFormData(makeAudioFile())),
    ).rejects.toThrow("Storage quota exceeded");
  });

  it("propagates database creation errors", async () => {
    mockAuthedSession("user-1");
    mockUploadRecording.mockResolvedValue({
      path: "user-1/1234.webm",
      publicUrl: "https://cdn.example.com/user-1/1234.webm",
    });
    mockNoteCreate.mockRejectedValue(new Error("DB write failed"));
    mockDeleteRecording.mockResolvedValue(undefined);

    await expect(
      uploadAndCreateNote(makeFormData(makeAudioFile())),
    ).rejects.toThrow("DB write failed");
  });

  it("deletes the uploaded file when database creation fails (orphan cleanup)", async () => {
    mockAuthedSession("user-1");
    mockUploadRecording.mockResolvedValue({
      path: "user-1/1234.webm",
      publicUrl: "https://cdn.example.com/user-1/1234.webm",
    });
    mockNoteCreate.mockRejectedValue(new Error("DB write failed"));
    mockDeleteRecording.mockResolvedValue(undefined);

    await expect(
      uploadAndCreateNote(makeFormData(makeAudioFile())),
    ).rejects.toThrow();

    expect(mockDeleteRecording).toHaveBeenCalledWith("user-1/1234.webm");
  });
});
