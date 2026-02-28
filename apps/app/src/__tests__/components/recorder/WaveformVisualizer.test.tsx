import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WaveformVisualizer } from "@/components/recorder/WaveformVisualizer";

function makeFrequencyData(length: number, fill = 0): Uint8Array {
  return new Uint8Array(length).fill(fill);
}

describe("WaveformVisualizer", () => {
  it("renders without crashing with all-zero frequency data", () => {
    const data = makeFrequencyData(128, 0);
    const { container } = render(<WaveformVisualizer frequencyData={data} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders a bar for each frequency bin", () => {
    const data = makeFrequencyData(128, 64);
    const { container } = render(<WaveformVisualizer frequencyData={data} />);
    const bars = container.querySelectorAll("[data-testid='waveform-bar']");
    expect(bars.length).toBe(128);
  });

  it("renders a different count of bars when given 64 bins", () => {
    const data = makeFrequencyData(64, 64);
    const { container } = render(<WaveformVisualizer frequencyData={data} />);
    const bars = container.querySelectorAll("[data-testid='waveform-bar']");
    expect(bars.length).toBe(64);
  });

  it("renders zero-height bars when all frequency values are 0", () => {
    const data = makeFrequencyData(128, 0);
    const { container } = render(<WaveformVisualizer frequencyData={data} />);
    const bars = container.querySelectorAll("[data-testid='waveform-bar']");
    bars.forEach((bar) => {
      const height = (bar as HTMLElement).style.height;
      // Height should be minimal / 0 when data is 0
      expect(height === "0%" || height === "0px" || height === "").toBeTruthy();
    });
  });

  it("renders an aria-hidden container (decorative, no screen reader content)", () => {
    const data = makeFrequencyData(128, 0);
    const { container } = render(<WaveformVisualizer frequencyData={data} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.getAttribute("aria-hidden")).toBe("true");
  });
});
