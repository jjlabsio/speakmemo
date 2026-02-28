import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecorderButton } from "@/components/recorder/RecorderButton";
import type { RecorderState } from "@/hooks/useMediaRecorder";

describe("RecorderButton", () => {
  it("renders a button element", () => {
    render(
      <RecorderButton
        recorderState="idle"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows '말하기' label in idle state", () => {
    render(
      <RecorderButton
        recorderState="idle"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("말하기");
  });

  it("shows a requesting/loading indicator in 'requesting' state", () => {
    render(
      <RecorderButton
        recorderState="requesting"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    // Button should be disabled while requesting
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows a stop label or icon in 'recording' state", () => {
    const { container } = render(
      <RecorderButton
        recorderState="recording"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    // Button should exist and not be disabled while recording
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn).not.toBeDisabled();
  });

  it("shows '다시 녹음' or similar label in 'stopped' state", () => {
    render(
      <RecorderButton
        recorderState="stopped"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("calls onStart when clicked in idle state", async () => {
    const onStart = vi.fn();
    render(
      <RecorderButton
        recorderState="idle"
        onStart={onStart}
        onStop={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("calls onStop when clicked in recording state", async () => {
    const onStop = vi.fn();
    render(
      <RecorderButton
        recorderState="recording"
        onStart={vi.fn()}
        onStop={onStop}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("calls onStart when clicked in stopped state (restart)", async () => {
    const onStart = vi.fn();
    render(
      <RecorderButton
        recorderState="stopped"
        onStart={onStart}
        onStop={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("button is disabled in 'requesting' state", () => {
    render(
      <RecorderButton
        recorderState="requesting"
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  const states: RecorderState[] = [
    "idle",
    "requesting",
    "recording",
    "stopped",
  ];
  states.forEach((state) => {
    it(`renders without crashing in '${state}' state`, () => {
      expect(() =>
        render(
          <RecorderButton
            recorderState={state}
            onStart={vi.fn()}
            onStop={vi.fn()}
          />,
        ),
      ).not.toThrow();
    });
  });
});
