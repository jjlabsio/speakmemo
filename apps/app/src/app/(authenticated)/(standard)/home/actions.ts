"use server";

import { headers } from "next/headers";
import { auth } from "@repo/auth";
import { uploadRecording, deleteRecording } from "@repo/storage";
import { database } from "@repo/database";
import { getFileExtension } from "@/lib/recorder-utils";

export interface UploadAndCreateNoteResult {
  noteId: string;
  recordingUrl: string;
}

/**
 * Server Action: upload an audio file to storage and create a Note record.
 *
 * Expects FormData with a "recording" field containing the audio File.
 * Authenticates the request via the current session.
 */
export async function uploadAndCreateNote(
  formData: FormData,
): Promise<UploadAndCreateNoteResult> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("Unauthorized: no active session");
  }

  const file = formData.get("recording");
  if (!file || !(file instanceof File)) {
    throw new Error(
      "Bad request: 'recording' field is missing or is not a File",
    );
  }

  const MIN_FILE_SIZE_BYTES = 1024; // 1 KB — reject silent/empty recordings
  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
  if (file.size < MIN_FILE_SIZE_BYTES || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Bad request: recording file size is out of bounds");
  }

  const ALLOWED_AUDIO_TYPES = new Set([
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
  ]);
  const baseContentType = (file.type || "").split(";")[0]!.trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(baseContentType)) {
    throw new Error("Bad request: unsupported audio format");
  }

  const userId = session.user.id;
  const contentType = baseContentType;
  const fileExtension = getFileExtension(contentType);

  const { path: recordingUrl } = await uploadRecording({
    userId,
    file,
    contentType,
    fileExtension,
  });

  let note: { id: string };
  try {
    note = await database.note.create({
      data: {
        userId,
        recordingUrl,
        status: "processing",
      },
    });
  } catch (err) {
    // Best-effort cleanup — prevent orphaned storage files when DB fails
    await deleteRecording(recordingUrl).catch(() => undefined);
    throw err;
  }

  return { noteId: note.id, recordingUrl };
}
