"use client";

const MAX_AMPLITUDE = 255;

interface WaveformVisualizerProps {
  frequencyData: Uint8Array;
  className?: string;
}

export function WaveformVisualizer({
  frequencyData,
  className,
}: WaveformVisualizerProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-end gap-[1px] ${className ?? ""}`}
    >
      {Array.from(frequencyData).map((value, binIndex) => {
        const heightPct = (value / MAX_AMPLITUDE) * 100;
        return (
          <span
            key={`bin-${binIndex}`}
            data-testid="waveform-bar"
            style={{ height: `${heightPct}%` }}
            className="flex-1 min-h-[2px] bg-current rounded-sm transition-all duration-75"
          />
        );
      })}
    </div>
  );
}
