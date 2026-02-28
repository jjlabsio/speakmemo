/**
 * Tests for useMediaRecorder hook.
 *
 * Strategy: fake timers for interval/timeout control, but Promise resolution
 * uses microtasks (queueMicrotask / Promise.resolve chains) so getUserMedia
 * resolves inside act() without needing a fake setTimeout flush.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

// ---------------------------------------------------------------------------
// Controllable MediaRecorder mock shared across tests
// ---------------------------------------------------------------------------
let onDataAvailable: ((e: { data: Blob }) => void) | null = null;
const mockTrackStop = vi.fn();
const mockAudioContextClose = vi.fn().mockResolvedValue(undefined);
const mockGetByteFrequencyData = vi.fn((arr: Uint8Array) => arr.fill(0));
const mockCreateAnalyser = vi.fn(() => ({
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: mockGetByteFrequencyData,
  connect: vi.fn(),
}));
const mockCreateMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
const mockGetUserMedia = vi.fn();

/**
 * FakeMediaRecorder fires onstop synchronously on stop() so act() captures
 * all state changes in a single batch.
 */
class FakeMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" = "inactive";

  constructor(
    public stream: MediaStream,
    _options?: MediaRecorderOptions,
  ) {}

  start(_timeslice?: number): void {
    this.state = "recording";
    onDataAvailable = (e) => this.ondataavailable?.(e);
  }

  stop(): void {
    this.state = "inactive";
    this.onstop?.();
  }
}

class FakeAudioContext {
  sampleRate = 16000;
  createAnalyser = mockCreateAnalyser;
  createMediaStreamSource = mockCreateMediaStreamSource;
  close = mockAudioContextClose;
}

function makeMockStream(): MediaStream {
  return {
    getTracks: () => [{ stop: mockTrackStop }],
  } as unknown as MediaStream;
}

beforeEach(() => {
  onDataAvailable = null;
  mockTrackStop.mockReset();
  mockAudioContextClose.mockReset().mockResolvedValue(undefined);
  mockGetByteFrequencyData.mockImplementation((arr: Uint8Array) => arr.fill(0));
  mockCreateAnalyser.mockReturnValue({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: mockGetByteFrequencyData,
    connect: vi.fn(),
  });
  mockCreateMediaStreamSource.mockReturnValue({ connect: vi.fn() });
  FakeMediaRecorder.isTypeSupported.mockReturnValue(true);
  mockGetUserMedia.mockReset().mockResolvedValue(makeMockStream());

  Object.defineProperty(globalThis, "MediaRecorder", {
    writable: true,
    configurable: true,
    value: FakeMediaRecorder,
  });
  Object.defineProperty(globalThis, "AudioContext", {
    writable: true,
    configurable: true,
    value: FakeAudioContext,
  });
  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    configurable: true,
    value: { getUserMedia: mockGetUserMedia },
  });

  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Starts a recording session by awaiting startRecording() inside act().
 * getUserMedia is resolved by the Promise microtask queue, which is NOT
 * blocked by fake timers.
 */
async function startSession(result: {
  current: ReturnType<typeof useMediaRecorder>;
}): Promise<void> {
  await act(async () => {
    await result.current.startRecording();
  });
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
describe("useMediaRecorder — initial state", () => {
  it("starts in 'idle' state", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.recorderState).toBe("idle");
  });

  it("has null recordedFile initially", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.recordedFile).toBeNull();
  });

  it("has elapsedSec of 0 initially", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.elapsedSec).toBe(0);
  });

  it("has null error initially", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.error).toBeNull();
  });

  it("exposes frequencyData as a Uint8Array of 128 bins", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.frequencyData).toBeInstanceOf(Uint8Array);
    expect(result.current.frequencyData.length).toBe(128);
  });
});

// ---------------------------------------------------------------------------
// startRecording
// ---------------------------------------------------------------------------
describe("useMediaRecorder — startRecording", () => {
  it("transitions to 'recording' after getUserMedia resolves", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);
    expect(result.current.recorderState).toBe("recording");
  });

  it("calls getUserMedia with audio constraint and sampleRate hint", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({ sampleRate: 16000 }),
    });
  });

  it("sets error and stays 'idle' when getUserMedia is denied", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);
    expect(result.current.recorderState).toBe("idle");
    expect(result.current.error).not.toBeNull();
  });

  it("does not start a second recording when already in 'recording' state", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);
    const callsBefore = mockGetUserMedia.mock.calls.length;
    await startSession(result);
    expect(mockGetUserMedia.mock.calls.length).toBe(callsBefore);
  });
});

// ---------------------------------------------------------------------------
// stopRecording
// ---------------------------------------------------------------------------
describe("useMediaRecorder — stopRecording", () => {
  it("transitions to 'stopped' and produces a File", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      onDataAvailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) });
      result.current.stopRecording();
    });

    expect(result.current.recorderState).toBe("stopped");
    expect(result.current.recordedFile).toBeInstanceOf(File);
  });

  it("stops all media stream tracks on stopRecording", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.recorderState).toBe("stopped");
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it("does nothing when called in 'idle' state", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(() => {
      act(() => {
        result.current.stopRecording();
      });
    }).not.toThrow();
    expect(result.current.recorderState).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// elapsedSec timer
// ---------------------------------------------------------------------------
describe("useMediaRecorder — elapsedSec timer", () => {
  it("increments elapsedSec by 1 for each elapsed second", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSec).toBe(3);
  });

  it("resets elapsedSec to 0 when a fresh recording begins", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSec).toBe(5);

    act(() => {
      result.current.stopRecording();
    });

    // Start a new recording — elapsedSec should reset
    await startSession(result);
    expect(result.current.elapsedSec).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Auto-stop at 300 seconds
// ---------------------------------------------------------------------------
describe("useMediaRecorder — auto-stop at 300 seconds", () => {
  it("automatically stops after exactly 300 seconds", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      vi.advanceTimersByTime(300_000);
    });

    expect(result.current.recorderState).toBe("stopped");
  });

  it("stays in 'recording' before the 300-second limit", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    await startSession(result);

    act(() => {
      vi.advanceTimersByTime(299_000);
    });

    expect(result.current.recorderState).toBe("recording");
  });
});

// ---------------------------------------------------------------------------
// Cleanup on unmount
// ---------------------------------------------------------------------------
describe("useMediaRecorder — cleanup on unmount", () => {
  it("stops stream tracks and closes AudioContext on unmount", async () => {
    const { result, unmount } = renderHook(() => useMediaRecorder());
    await startSession(result);

    unmount();

    expect(mockTrackStop).toHaveBeenCalled();
    expect(mockAudioContextClose).toHaveBeenCalled();
  });
});
