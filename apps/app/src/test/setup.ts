import "@testing-library/jest-dom";

// ---------------------------------------------------------------------------
// MediaRecorder stub (jsdom does not implement the Web Media APIs)
// ---------------------------------------------------------------------------
class MockMediaRecorder {
  static isTypeSupported(_type: string): boolean {
    return false;
  }
  state: "inactive" | "recording" | "paused" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: { error: Error }) => void) | null = null;

  constructor(
    public stream: MediaStream,
    public options?: MediaRecorderOptions,
  ) {}

  start(_timeslice?: number): void {
    this.state = "recording";
  }
  stop(): void {
    this.state = "inactive";
    this.onstop?.();
  }
  pause(): void {
    this.state = "paused";
  }
  resume(): void {
    this.state = "recording";
  }
}

// Attach to globalThis so tests can spy on MediaRecorder.isTypeSupported
Object.defineProperty(globalThis, "MediaRecorder", {
  writable: true,
  configurable: true,
  value: MockMediaRecorder,
});

// ---------------------------------------------------------------------------
// AudioContext / AnalyserNode stub
// ---------------------------------------------------------------------------
class MockAnalyserNode {
  fftSize = 256;
  frequencyBinCount = 128;
  getByteFrequencyData(array: Uint8Array): void {
    array.fill(0);
  }
  connect(_destination: unknown): void {}
  disconnect(): void {}
}

class MockMediaStreamSource {
  connect(_destination: unknown): void {}
  disconnect(): void {}
}

class MockAudioContext {
  sampleRate = 16000;
  state: "suspended" | "running" | "closed" = "running";

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode();
  }
  createMediaStreamSource(_stream: MediaStream): MockMediaStreamSource {
    return new MockMediaStreamSource();
  }
  async close(): Promise<void> {
    this.state = "closed";
  }
}

Object.defineProperty(globalThis, "AudioContext", {
  writable: true,
  configurable: true,
  value: MockAudioContext,
});

// ---------------------------------------------------------------------------
// navigator.mediaDevices stub
// ---------------------------------------------------------------------------
Object.defineProperty(globalThis.navigator, "mediaDevices", {
  writable: true,
  configurable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream),
  },
});
