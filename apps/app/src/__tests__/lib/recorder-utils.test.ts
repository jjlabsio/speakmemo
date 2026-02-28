import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSupportedMimeType,
  getFileExtension,
  chunksToFile,
} from "@/lib/recorder-utils";

// ---------------------------------------------------------------------------
// getSupportedMimeType
// ---------------------------------------------------------------------------
describe("getSupportedMimeType", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns audio/webm;codecs=opus when MediaRecorder supports it (Chrome)", () => {
    vi.spyOn(MediaRecorder, "isTypeSupported").mockImplementation(
      (type) => type === "audio/webm;codecs=opus",
    );
    expect(getSupportedMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("returns audio/mp4 when webm is unsupported but mp4 is (Safari)", () => {
    vi.spyOn(MediaRecorder, "isTypeSupported").mockImplementation(
      (type) => type === "audio/mp4",
    );
    expect(getSupportedMimeType()).toBe("audio/mp4");
  });

  it("returns audio/webm as fallback when only webm is supported", () => {
    vi.spyOn(MediaRecorder, "isTypeSupported").mockImplementation(
      (type) => type === "audio/webm",
    );
    expect(getSupportedMimeType()).toBe("audio/webm");
  });

  it("returns empty string when no supported type is found", () => {
    vi.spyOn(MediaRecorder, "isTypeSupported").mockReturnValue(false);
    expect(getSupportedMimeType()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getFileExtension
// ---------------------------------------------------------------------------
describe("getFileExtension", () => {
  it("returns 'webm' for audio/webm;codecs=opus", () => {
    expect(getFileExtension("audio/webm;codecs=opus")).toBe("webm");
  });

  it("returns 'webm' for audio/webm", () => {
    expect(getFileExtension("audio/webm")).toBe("webm");
  });

  it("returns 'm4a' for audio/mp4", () => {
    expect(getFileExtension("audio/mp4")).toBe("m4a");
  });

  it("returns 'ogg' for audio/ogg", () => {
    expect(getFileExtension("audio/ogg")).toBe("ogg");
  });

  it("returns 'bin' for unknown/unsupported mime type", () => {
    expect(getFileExtension("audio/unknown-format")).toBe("bin");
  });

  it("returns 'bin' for empty string mime type", () => {
    expect(getFileExtension("")).toBe("bin");
  });

  it("returns 'bin' for completely invalid mime type", () => {
    expect(getFileExtension("not-a-mime-type")).toBe("bin");
  });
});

// ---------------------------------------------------------------------------
// chunksToFile
// ---------------------------------------------------------------------------
describe("chunksToFile", () => {
  it("creates a File from Blob chunks with the correct name", () => {
    const chunk1 = new Blob(["hello"], { type: "audio/webm" });
    const chunk2 = new Blob([" world"], { type: "audio/webm" });
    const file = chunksToFile([chunk1, chunk2], "audio/webm", "recording.webm");

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("recording.webm");
  });

  it("sets the correct MIME type on the resulting file", () => {
    const chunk = new Blob(["data"], { type: "audio/webm" });
    const file = chunksToFile([chunk], "audio/webm;codecs=opus", "test.webm");

    expect(file.type).toBe("audio/webm;codecs=opus");
  });

  it("concatenates all chunks into a single file", async () => {
    const part1 = new Blob(["abc"]);
    const part2 = new Blob(["def"]);
    const file = chunksToFile([part1, part2], "audio/webm", "test.webm");

    const text = await file.text();
    expect(text).toBe("abcdef");
    expect(file.size).toBe(6);
  });

  it("handles a single chunk", () => {
    const chunk = new Blob(["single"], { type: "audio/mp4" });
    const file = chunksToFile([chunk], "audio/mp4", "recording.m4a");

    expect(file.name).toBe("recording.m4a");
    expect(file.size).toBe(6);
  });

  it("handles an empty chunks array, producing a zero-byte file", () => {
    const file = chunksToFile([], "audio/webm", "empty.webm");

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(0);
    expect(file.name).toBe("empty.webm");
  });

  it("preserves the provided fileName exactly", () => {
    const chunk = new Blob(["x"]);
    const file = chunksToFile([chunk], "audio/webm", "my recording 2024.webm");
    expect(file.name).toBe("my recording 2024.webm");
  });
});
