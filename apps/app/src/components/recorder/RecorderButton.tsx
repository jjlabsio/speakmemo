"use client";

import type { RecorderState } from "@/hooks/useMediaRecorder";

interface RecorderButtonProps {
  recorderState: RecorderState;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

const STATE_CONFIG: Record<
  RecorderState,
  { label: string; disabled: boolean; onClick: "start" | "stop" | "start" }
> = {
  idle: { label: "말하기", disabled: false, onClick: "start" },
  requesting: { label: "마이크 연결 중...", disabled: true, onClick: "start" },
  recording: { label: "녹음 중지", disabled: false, onClick: "stop" },
  stopped: { label: "다시 녹음", disabled: false, onClick: "start" },
};

export function RecorderButton({
  recorderState,
  onStart,
  onStop,
  className,
}: RecorderButtonProps) {
  const { label, disabled, onClick } = STATE_CONFIG[recorderState];
  const handleClick = onClick === "stop" ? onStop : onStart;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={label}
      className={className}
    >
      {label}
    </button>
  );
}
