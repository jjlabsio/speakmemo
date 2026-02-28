"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type NoteStatus =
  | "idle"
  | "processing"
  | "transcribed"
  | "summarized"
  | "failed";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES: ReadonlySet<NoteStatus> = new Set([
  "summarized",
  "failed",
]);

export interface UseNotePollingReturn {
  status: NoteStatus;
  isPolling: boolean;
  startPolling: (noteId: string) => void;
  stopPolling: () => void;
}

export function useNotePolling(): UseNotePollingReturn {
  const [status, setStatus] = useState<NoteStatus>("idle");
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    clearPollingInterval();
    setIsPolling(false);
  }, [clearPollingInterval]);

  const pollOnce = useCallback(
    async (noteId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/notes/${encodeURIComponent(noteId)}/status`,
        );
        if (!response.ok) {
          setStatus("failed");
          stopPolling();
          return false;
        }
        const data = (await response.json()) as { status: NoteStatus };
        setStatus(data.status);
        if (TERMINAL_STATUSES.has(data.status)) {
          stopPolling();
          return false;
        }
        return true;
      } catch {
        setStatus("failed");
        stopPolling();
        return false;
      }
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (noteId: string) => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      setIsPolling(true);

      // Immediate first poll
      void pollOnce(noteId).then((shouldContinue) => {
        if (!shouldContinue || !isPollingRef.current) return;

        intervalRef.current = setInterval(async () => {
          if (!isPollingRef.current) {
            clearPollingInterval();
            return;
          }
          await pollOnce(noteId);
        }, POLL_INTERVAL_MS);
      });
    },
    [pollOnce, clearPollingInterval],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPollingRef.current = false;
      clearPollingInterval();
    };
  }, [clearPollingInterval]);

  return { status, isPolling, startPolling, stopPolling };
}
