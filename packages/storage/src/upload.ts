import "server-only";

import { supabase } from "./client";

const RECORDINGS_BUCKET = "recordings";
const SAFE_PATH_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function validatePathSegment(value: string, name: string): void {
  if (!SAFE_PATH_SEGMENT.test(value)) {
    throw new Error(
      `Invalid ${name}: must contain only alphanumeric, underscore, or hyphen characters`,
    );
  }
}

interface UploadRecordingParams {
  readonly userId: string;
  readonly file: File | Blob;
  readonly contentType: string;
  readonly fileExtension: string;
}

interface UploadRecordingResult {
  readonly path: string;
  readonly publicUrl: string;
}

export async function uploadRecording({
  userId,
  file,
  contentType,
  fileExtension,
}: UploadRecordingParams): Promise<UploadRecordingResult> {
  validatePathSegment(userId, "userId");
  validatePathSegment(fileExtension, "fileExtension");

  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.${fileExtension}`;

  const { error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload recording: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(RECORDINGS_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: urlData.publicUrl,
  };
}

export function getRecordingUrl(path: string): string {
  const { data: urlData } = supabase.storage
    .from(RECORDINGS_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function deleteRecording(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}

export async function downloadRecording(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .download(path);

  if (error) {
    throw new Error(`Failed to download recording: ${error.message}`);
  }

  return data;
}
