import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordingStatus } from "@/components/recorder/RecordingStatus";
import type { NoteStatus } from "@/hooks/useNotePolling";

describe("RecordingStatus", () => {
  it("renders nothing when status is 'idle'", () => {
    const { container } = render(<RecordingStatus status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows '음성을 듣고 있어요...' for 'processing' status", () => {
    render(<RecordingStatus status="processing" />);
    expect(screen.getByText(/음성을 듣고 있어요/)).toBeInTheDocument();
  });

  it("shows '내용을 받아적고 있어요...' for 'transcribed' status", () => {
    render(<RecordingStatus status="transcribed" />);
    expect(screen.getByText(/받아적고 있어요/)).toBeInTheDocument();
  });

  it("shows '깔끔하게 정리하고 있어요...' for 'summarized' status", () => {
    render(<RecordingStatus status="summarized" />);
    expect(screen.getByText(/정리/)).toBeInTheDocument();
  });

  it("shows failure message for 'failed' status", () => {
    render(<RecordingStatus status="failed" />);
    expect(screen.getByText(/실패/)).toBeInTheDocument();
  });

  it("renders a role='status' element for screen-reader accessibility", () => {
    render(<RecordingStatus status="processing" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  const statuses: NoteStatus[] = [
    "idle",
    "processing",
    "transcribed",
    "summarized",
    "failed",
  ];
  statuses.forEach((status) => {
    it(`renders without crashing for '${status}' status`, () => {
      expect(() => render(<RecordingStatus status={status} />)).not.toThrow();
    });
  });
});
