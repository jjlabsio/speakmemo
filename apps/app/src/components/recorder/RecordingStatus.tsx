"use client";

import type { NoteStatus } from "@/hooks/useNotePolling";

// Branding guide status messages
const STATUS_MESSAGES: Partial<Record<NoteStatus, string>> = {
  processing: "음성을 듣고 있어요...",
  transcribed: "내용을 받아적고 있어요...",
  summarized: "깔끔하게 정리하고 있어요...",
  failed: "정리에 실패했어요. 다시 시도해 주세요.",
};

interface RecordingStatusProps {
  status: NoteStatus;
  className?: string;
}

export function RecordingStatus({ status, className }: RecordingStatusProps) {
  const message = STATUS_MESSAGES[status];

  if (!message) return null;

  return (
    <p role="status" aria-live="polite" className={className}>
      {message}
    </p>
  );
}
