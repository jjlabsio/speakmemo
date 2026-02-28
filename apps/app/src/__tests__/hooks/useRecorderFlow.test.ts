/**
 * Tests for useRecorderFlow hook.
 *
 * This hook orchestrates the full recording flow:
 *   1. useMediaRecorder produces a recordedFile when stopped
 *   2. uploadAndCreateNote server action is called with the file
 *   3. useNotePolling starts polling with the returned noteId
 *
 * All external dependencies are mocked — no real MediaRecorder, storage, or DB.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecorderFlow } from "@/hooks/useRecorderFlow";

// ---------------------------------------------------------------------------
// Mock useMediaRecorder
// ---------------------------------------------------------------------------
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
let mockRecorderState: "idle" | "requesting" | "recording" | "stopped" = "idle";
let mockRecordedFile: File | null = null;
let mockRecorderError: string | null = null;

vi.mock("@/hooks/useMediaRecorder", () => ({
  useMediaRecorder: () => ({
    recorderState: mockRecorderState,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    recordedFile: mockRecordedFile,
    elapsedSec: 0,
    frequencyData: new Uint8Array(128),
    error: mockRecorderError,
  }),
}));

// ---------------------------------------------------------------------------
// Mock useNotePolling
// ---------------------------------------------------------------------------
const mockStartPolling = vi.fn();
const mockStopPolling = vi.fn();
let mockPollingStatus:
  | "idle"
  | "processing"
  | "transcribed"
  | "summarized"
  | "failed" = "idle";
let mockIsPolling = false;

vi.mock("@/hooks/useNotePolling", () => ({
  useNotePolling: () => ({
    status: mockPollingStatus,
    isPolling: mockIsPolling,
    startPolling: mockStartPolling,
    stopPolling: mockStopPolling,
  }),
}));

// ---------------------------------------------------------------------------
// Mock uploadAndCreateNote server action
// ---------------------------------------------------------------------------
const mockUploadAndCreateNote = vi.fn();

vi.mock("@/app/(authenticated)/(standard)/home/actions", () => ({
  uploadAndCreateNote: (...args: unknown[]) => mockUploadAndCreateNote(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeAudioFile(): File {
  const blob = new Blob([new Uint8Array(1024)], { type: "audio/webm" });
  return new File([blob], "recording.webm", { type: "audio/webm" });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useRecorderFlow", () => {
  beforeEach(() => {
    mockStartRecording.mockReset();
    mockStopRecording.mockReset();
    mockStartPolling.mockReset();
    mockStopPolling.mockReset();
    mockUploadAndCreateNote.mockReset();

    mockRecorderState = "idle";
    mockRecordedFile = null;
    mockRecorderError = null;
    mockPollingStatus = "idle";
    mockIsPolling = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("exposes recorderState, noteStatus, isUploading, and error from the start", () => {
      const { result } = renderHook(() => useRecorderFlow());

      expect(result.current.recorderState).toBe("idle");
      expect(result.current.noteStatus).toBe("idle");
      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("exposes elapsedSec and frequencyData passed through from useMediaRecorder", () => {
      const { result } = renderHook(() => useRecorderFlow());

      expect(result.current.elapsedSec).toBe(0);
      expect(result.current.frequencyData).toBeInstanceOf(Uint8Array);
    });

    it("exposes start and stop callbacks", () => {
      const { result } = renderHook(() => useRecorderFlow());

      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // start() delegation
  // -------------------------------------------------------------------------
  describe("start()", () => {
    it("delegates to startRecording from useMediaRecorder", async () => {
      mockStartRecording.mockResolvedValue(undefined);
      const { result } = renderHook(() => useRecorderFlow());

      await act(async () => {
        await result.current.start();
      });

      expect(mockStartRecording).toHaveBeenCalledOnce();
    });

    it("sets error when startRecording throws", async () => {
      mockStartRecording.mockRejectedValue(new Error("Mic denied"));
      const { result } = renderHook(() => useRecorderFlow());

      await act(async () => {
        await result.current.start();
      });

      expect(result.current.error).toBe("Mic denied");
    });
  });

  // -------------------------------------------------------------------------
  // stop() delegation
  // -------------------------------------------------------------------------
  describe("stop()", () => {
    it("delegates to stopRecording from useMediaRecorder", () => {
      const { result } = renderHook(() => useRecorderFlow());

      act(() => {
        result.current.stop();
      });

      expect(mockStopRecording).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Upload flow: when recordedFile becomes available
  // -------------------------------------------------------------------------
  describe("upload flow", () => {
    it("sets isUploading to true while the upload is in progress", async () => {
      // Simulate a file appearing after stop
      let resolveUpload!: (value: {
        noteId: string;
        recordingUrl: string;
      }) => void;
      mockUploadAndCreateNote.mockReturnValue(
        new Promise((res) => {
          resolveUpload = res;
        }),
      );

      const { result, rerender } = renderHook(() => useRecorderFlow());

      // Simulate recordedFile becoming available (recorder stopped)
      mockRecordedFile = makeAudioFile();
      mockRecorderState = "stopped";

      await act(async () => {
        rerender();
        await Promise.resolve(); // flush effect scheduling
      });

      expect(result.current.isUploading).toBe(true);

      // Resolve the upload to clean up
      await act(async () => {
        resolveUpload({ noteId: "note-1", recordingUrl: "url" });
        await Promise.resolve();
      });
    });

    it("calls uploadAndCreateNote with a FormData containing the recorded file", async () => {
      const file = makeAudioFile();
      mockRecordedFile = file;
      mockRecorderState = "stopped";
      mockUploadAndCreateNote.mockResolvedValue({
        noteId: "note-abc",
        recordingUrl: "https://storage/note-abc.webm",
      });
      mockStartPolling.mockImplementation(() => {});

      await act(async () => {
        renderHook(() => useRecorderFlow());
        await Promise.resolve();
      });

      expect(mockUploadAndCreateNote).toHaveBeenCalledOnce();
      const calledArg = mockUploadAndCreateNote.mock.calls[0]![0] as FormData;
      expect(calledArg).toBeInstanceOf(FormData);
      expect(calledArg.get("recording")).toBe(file);
    });

    it("starts polling with the noteId returned by uploadAndCreateNote", async () => {
      mockRecordedFile = makeAudioFile();
      mockRecorderState = "stopped";
      mockUploadAndCreateNote.mockResolvedValue({
        noteId: "note-xyz",
        recordingUrl: "https://storage/note-xyz.webm",
      });

      await act(async () => {
        renderHook(() => useRecorderFlow());
        await Promise.resolve();
      });

      expect(mockStartPolling).toHaveBeenCalledWith("note-xyz");
    });

    it("sets isUploading to false after upload completes", async () => {
      mockRecordedFile = makeAudioFile();
      mockRecorderState = "stopped";
      mockUploadAndCreateNote.mockResolvedValue({
        noteId: "note-1",
        recordingUrl: "url",
      });

      const { result } = renderHook(() => useRecorderFlow());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve(); // second tick for state update
      });

      expect(result.current.isUploading).toBe(false);
    });

    it("sets error and isUploading=false when upload fails", async () => {
      mockRecordedFile = makeAudioFile();
      mockRecorderState = "stopped";
      mockUploadAndCreateNote.mockRejectedValue(
        new Error("Storage quota exceeded"),
      );

      const { result } = renderHook(() => useRecorderFlow());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe("Storage quota exceeded");
      expect(result.current.isUploading).toBe(false);
    });

    it("does not call uploadAndCreateNote when recordedFile is null", async () => {
      mockRecordedFile = null;
      mockRecorderState = "idle";

      await act(async () => {
        renderHook(() => useRecorderFlow());
        await Promise.resolve();
      });

      expect(mockUploadAndCreateNote).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // noteStatus pass-through
  // -------------------------------------------------------------------------
  describe("noteStatus", () => {
    it("reflects the current polling status from useNotePolling", () => {
      mockPollingStatus = "processing";
      const { result } = renderHook(() => useRecorderFlow());

      expect(result.current.noteStatus).toBe("processing");
    });

    it("reflects summarized status when polling completes", () => {
      mockPollingStatus = "summarized";
      const { result } = renderHook(() => useRecorderFlow());

      expect(result.current.noteStatus).toBe("summarized");
    });
  });

  // -------------------------------------------------------------------------
  // error pass-through from recorder
  // -------------------------------------------------------------------------
  describe("recorder error pass-through", () => {
    it("exposes the recorder error when useMediaRecorder sets one", () => {
      mockRecorderError = "마이크 권한을 허용해 주세요.";
      const { result } = renderHook(() => useRecorderFlow());

      expect(result.current.error).toBe("마이크 권한을 허용해 주세요.");
    });
  });
});
