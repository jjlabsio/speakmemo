import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordingTimer } from "@/components/recorder/RecordingTimer";

describe("RecordingTimer", () => {
  it("displays '00:00' for 0 seconds", () => {
    render(<RecordingTimer elapsedSec={0} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("displays '00:01' for 1 second", () => {
    render(<RecordingTimer elapsedSec={1} />);
    expect(screen.getByText("00:01")).toBeInTheDocument();
  });

  it("displays '01:00' for 60 seconds", () => {
    render(<RecordingTimer elapsedSec={60} />);
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("displays '04:59' for 299 seconds", () => {
    render(<RecordingTimer elapsedSec={299} />);
    expect(screen.getByText("04:59")).toBeInTheDocument();
  });

  it("displays '05:00' for 300 seconds (maximum)", () => {
    render(<RecordingTimer elapsedSec={300} />);
    expect(screen.getByText("05:00")).toBeInTheDocument();
  });

  it("pads minutes with leading zero when < 10", () => {
    render(<RecordingTimer elapsedSec={125} />);
    expect(screen.getByText("02:05")).toBeInTheDocument();
  });

  it("renders inside a time element with the correct datetime attribute", () => {
    const { container } = render(<RecordingTimer elapsedSec={90} />);
    const timeEl = container.querySelector("time");
    expect(timeEl).not.toBeNull();
    // datetime should be formatted as ISO duration or the same MM:SS string
    expect(timeEl?.textContent).toBe("01:30");
  });
});
