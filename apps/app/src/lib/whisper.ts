import "server-only";

import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const RATE_LIMIT_STATUS = 429;
const RETRY_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: WhisperSegment[];
  durationSec: number;
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------
export class WhisperError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WhisperError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: unknown }).status === RATE_LIMIT_STATUS
  );
}

function buildOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new WhisperError("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Transcribes an audio Blob using the OpenAI Whisper API.
 *
 * @param audioBlob - Raw audio data. Must be under 25 MB.
 * @param filename  - Filename hint sent to the API (e.g. "recording.webm").
 * @returns Parsed transcription result with text, segments, and durationSec.
 * @throws {WhisperError} on size violation, missing API key, or API failure.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  filename: string,
): Promise<TranscriptionResult> {
  if (audioBlob.size === 0) {
    throw new WhisperError("Audio blob is empty (0 bytes)");
  }

  if (audioBlob.size > MAX_AUDIO_SIZE_BYTES) {
    throw new WhisperError(
      `Audio file exceeds the 25MB limit (received ${audioBlob.size} bytes)`,
    );
  }

  const client = buildOpenAIClient();

  const file = new File([audioBlob], filename, { type: audioBlob.type });

  async function callWhisper(): Promise<TranscriptionResult> {
    const response = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ko",
      response_format: "verbose_json",
    });

    // verbose_json returns a typed response with segments and duration.
    // Cast to access the extended fields not always present in the base type.
    const verboseResponse = response as {
      text: string;
      duration?: number;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    const segments: WhisperSegment[] = (verboseResponse.segments ?? []).map(
      (seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      }),
    );

    return {
      text: verboseResponse.text,
      segments,
      durationSec: verboseResponse.duration ?? 0,
    };
  }

  try {
    return await callWhisper();
  } catch (firstError) {
    if (!isRateLimitError(firstError)) {
      throw new WhisperError(
        `Transcription failed: ${firstError instanceof Error ? firstError.message : String(firstError)}`,
        firstError,
      );
    }

    // Rate limit: wait 500 ms then retry once
    await delay(RETRY_DELAY_MS);

    try {
      return await callWhisper();
    } catch (retryError) {
      throw new WhisperError(
        `Transcription failed after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
        retryError,
      );
    }
  }
}
