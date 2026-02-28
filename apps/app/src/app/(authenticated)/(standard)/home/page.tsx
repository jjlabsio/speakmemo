"use client";

import { useRecorderFlow } from "@/hooks/useRecorderFlow";
import { RecorderButton } from "@/components/recorder/RecorderButton";
import { RecordingTimer } from "@/components/recorder/RecordingTimer";
import { WaveformVisualizer } from "@/components/recorder/WaveformVisualizer";
import { RecordingStatus } from "@/components/recorder/RecordingStatus";

export default function HomePage() {
  const {
    recorderState,
    noteStatus,
    isUploading,
    error,
    elapsedSec,
    frequencyData,
    start,
    stop,
  } = useRecorderFlow();

  const isRecording = recorderState === "recording";
  const showTimer = isRecording || recorderState === "stopped";
  const showWaveform = isRecording;
  const showPollingStatus =
    isUploading ||
    noteStatus === "processing" ||
    noteStatus === "transcribed" ||
    noteStatus === "summarized" ||
    noteStatus === "failed";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4">
      {/* Waveform — visible only while recording */}
      {showWaveform && (
        <WaveformVisualizer
          frequencyData={frequencyData}
          className="h-16 w-full max-w-xs text-primary"
        />
      )}

      {/* Elapsed time — visible once recording starts */}
      {showTimer && (
        <RecordingTimer
          elapsedSec={elapsedSec}
          className="text-4xl font-mono tabular-nums text-foreground"
        />
      )}

      {/* Main action button */}
      <RecorderButton
        recorderState={recorderState}
        onStart={start}
        onStop={stop}
        className="h-24 w-24 rounded-full text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />

      {/* Processing / polling status messages */}
      {showPollingStatus && (
        <RecordingStatus
          status={isUploading ? "processing" : noteStatus}
          className="text-sm text-muted-foreground"
        />
      )}

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className="max-w-xs text-center text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
