/**
 * Unit tests for src/lib/whisper.ts
 *
 * Tests cover:
 * - Normal transcription response parsing
 * - 25 MB size guard
 * - Missing OPENAI_API_KEY guard
 * - Rate-limit (429) retry behaviour
 * - verbose_json segment / durationSec extraction
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only must be mocked before any import of whisper.ts
vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// OpenAI SDK mock
// ---------------------------------------------------------------------------
const mockCreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeBlob(sizeBytes: number): Blob {
  // Creates a Blob whose .size property equals sizeBytes without allocating
  // real memory (unit-test only).
  const arr = new Uint8Array(sizeBytes);
  return new Blob([arr]);
}

const VALID_VERBOSE_JSON_RESPONSE = {
  text: "안녕하세요 테스트입니다",
  duration: 5.2,
  segments: [
    { id: 0, start: 0.0, end: 2.5, text: "안녕하세요" },
    { id: 1, start: 2.5, end: 5.2, text: " 테스트입니다" },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("transcribeAudio", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "test-api-key" };
    mockCreate.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.useRealTimers();
  });

  it("returns parsed text, segments, and durationSec for a valid response", async () => {
    mockCreate.mockResolvedValueOnce(VALID_VERBOSE_JSON_RESPONSE);

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);
    const result = await transcribeAudio(blob, "recording.webm");

    expect(result.text).toBe("안녕하세요 테스트입니다");
    expect(result.durationSec).toBeCloseTo(5.2);
    expect(result.segments).toHaveLength(2);
  });

  it("correctly maps verbose_json segments to WhisperSegment shape", async () => {
    mockCreate.mockResolvedValueOnce(VALID_VERBOSE_JSON_RESPONSE);

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);
    const result = await transcribeAudio(blob, "recording.webm");

    expect(result.segments[0]).toEqual({
      start: 0.0,
      end: 2.5,
      text: "안녕하세요",
    });
    expect(result.segments[1]).toEqual({
      start: 2.5,
      end: 5.2,
      text: " 테스트입니다",
    });
  });

  it("throws WhisperError when blob exceeds 25 MB", async () => {
    const { transcribeAudio } = await import("@/lib/whisper");
    const oversizedBlob = makeBlob(26 * 1024 * 1024); // 26 MB

    await expect(transcribeAudio(oversizedBlob, "large.webm")).rejects.toThrow(
      /25MB/,
    );
  });

  it("throws an error when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);

    await expect(transcribeAudio(blob, "recording.webm")).rejects.toThrow(
      /OPENAI_API_KEY/,
    );
  });

  it("retries once on rate limit (429) error and succeeds on second attempt", async () => {
    const rateLimitError = Object.assign(new Error("Rate limit exceeded"), {
      status: 429,
    });
    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(VALID_VERBOSE_JSON_RESPONSE);

    // Use fake timers to avoid real 500 ms delay in unit tests
    vi.useFakeTimers();

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);

    const promise = transcribeAudio(blob, "recording.webm");
    // Advance past the 500 ms retry delay
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.text).toBe("안녕하세요 테스트입니다");

    vi.useRealTimers();
  });

  it("throws WhisperError wrapping a non-rate-limit API error without retrying", async () => {
    const apiError = Object.assign(new Error("Invalid audio format"), {
      status: 400,
    });
    mockCreate.mockRejectedValueOnce(apiError);

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);

    await expect(transcribeAudio(blob, "recording.webm")).rejects.toThrow(
      /WhisperError|Invalid audio format/,
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("throws WhisperError if rate limit persists on second attempt", async () => {
    const rateLimitError = Object.assign(new Error("Rate limit exceeded"), {
      status: 429,
    });
    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError);

    vi.useFakeTimers();

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);

    // Kick off the call, advance timers, then await rejection together
    let caughtError: unknown;
    const promise = transcribeAudio(blob, "recording.webm").catch((e) => {
      caughtError = e;
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toMatch(
      /WhisperError|Rate limit|Transcription failed/,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("calls OpenAI with correct model, language, and response_format", async () => {
    mockCreate.mockResolvedValueOnce(VALID_VERBOSE_JSON_RESPONSE);

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);
    await transcribeAudio(blob, "recording.webm");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        language: "ko",
        response_format: "verbose_json",
      }),
    );
  });

  it("returns empty segments array and zero durationSec when API omits those fields", async () => {
    // verbose_json response without optional fields
    mockCreate.mockResolvedValueOnce({ text: "짧은 녹음" });

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);
    const result = await transcribeAudio(blob, "recording.webm");

    expect(result.text).toBe("짧은 녹음");
    expect(result.segments).toEqual([]);
    expect(result.durationSec).toBe(0);
  });

  it("wraps a non-Error thrown value in WhisperError message", async () => {
    // Simulate an API that throws a plain string instead of an Error object
    mockCreate.mockRejectedValueOnce("unexpected string error");

    const { transcribeAudio } = await import("@/lib/whisper");
    const blob = makeBlob(1024);

    await expect(transcribeAudio(blob, "recording.webm")).rejects.toThrow(
      /unexpected string error/,
    );
  });
});
