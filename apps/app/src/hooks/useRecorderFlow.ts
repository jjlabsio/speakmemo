"use client";

import { useState, useEffect, useCallback } from "react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useNotePolling } from "@/hooks/useNotePolling";
import { uploadAndCreateNote } from "@/app/(authenticated)/(standard)/home/actions";
import type { RecorderState } from "@/hooks/useMediaRecorder";
import type { NoteStatus } from "@/hooks/useNotePolling";

export interface UseRecorderFlowReturn {
  recorderState: RecorderState;
  noteStatus: NoteStatus;
  isUploading: boolean;
  error: string | null;
  elapsedSec: number;
  frequencyData: Uint8Array;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Orchestrates the full recording → upload → polling flow.
 *
 * 1. Delegates start/stop to useMediaRecorder.
 * 2. When a recordedFile becomes available (recorder stopped), builds a
 *    FormData, calls uploadAndCreateNote, then starts polling with the
 *    returned noteId.
 * 3. Surfaces a unified error string from either the recorder or upload step.
 */
export function useRecorderFlow(): UseRecorderFlowReturn {
  const {
    recorderState,
    startRecording,
    stopRecording,
    recordedFile,
    elapsedSec,
    frequencyData,
    error: recorderError,
  } = useMediaRecorder();

  const { status: noteStatus, startPolling } = useNotePolling();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // When the recorder finishes and produces a file, trigger upload + polling.
  useEffect(() => {
    if (!recordedFile) return;

    let cancelled = false;

    const upload = async () => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("recording", recordedFile);

        const { noteId } = await uploadAndCreateNote(formData);

        if (!cancelled) {
          startPolling(noteId);
        }
      } catch (err) {
        if (!cancelled) {
          setUploadError(
            err instanceof Error ? err.message : "업로드에 실패했어요.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsUploading(false);
        }
      }
    };

    void upload();

    return () => {
      cancelled = true;
    };
  }, [recordedFile, startPolling]);

  const start = useCallback(async () => {
    setUploadError(null);
    try {
      await startRecording();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "녹음을 시작할 수 없어요.",
      );
    }
  }, [startRecording]);

  const stop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Prefer the upload/start error over the recorder's passive error string
  const error = uploadError ?? recorderError;

  return {
    recorderState,
    noteStatus,
    isUploading,
    error,
    elapsedSec,
    frequencyData,
    start,
    stop,
  };
}
