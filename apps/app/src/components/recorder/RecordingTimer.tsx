"use client";

interface RecordingTimerProps {
  elapsedSec: number;
  className?: string;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecordingTimer({ elapsedSec, className }: RecordingTimerProps) {
  const formatted = formatTime(elapsedSec);

  return (
    <time
      dateTime={formatted}
      className={className}
      aria-live="off"
      aria-label={`녹음 시간: ${formatted}`}
    >
      {formatted}
    </time>
  );
}
