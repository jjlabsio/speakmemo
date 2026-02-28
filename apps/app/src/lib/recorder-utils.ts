/**
 * Ordered list of MIME types to probe for browser support.
 * Chrome supports audio/webm;codecs=opus, Safari supports audio/mp4.
 */
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

/**
 * Maps base MIME type to file extension.
 * Falls back to "bin" for unknown types.
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

/**
 * Returns the first MIME type that MediaRecorder supports in the current browser.
 * Returns an empty string if no supported type is found.
 */
export function getSupportedMimeType(): string {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "";
}

/**
 * Derives a file extension from a MIME type string.
 * Handles codec parameters (e.g. "audio/webm;codecs=opus" → "webm").
 * Returns "bin" for unknown or empty MIME types.
 */
export function getFileExtension(mimeType: string): string {
  if (!mimeType) return "bin";

  // Strip codec parameters: "audio/webm;codecs=opus" → "audio/webm"
  const baseMimeType = mimeType.split(";")[0]!.trim();

  return MIME_TO_EXTENSION[baseMimeType] ?? "bin";
}

/**
 * Merges an array of Blob chunks into a single named File.
 *
 * @param chunks    - Array of Blob chunks from MediaRecorder.ondataavailable
 * @param mimeType  - MIME type to assign (e.g. "audio/webm;codecs=opus")
 * @param fileName  - Desired file name (e.g. "recording.webm")
 */
export function chunksToFile(
  chunks: Blob[],
  mimeType: string,
  fileName: string,
): File {
  const blob = new Blob(chunks, { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}
