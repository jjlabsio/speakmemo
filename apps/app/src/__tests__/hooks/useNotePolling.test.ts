import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotePolling } from "@/hooks/useNotePolling";
import type { NoteStatus } from "@/hooks/useNotePolling";

const POLL_INTERVAL_MS = 2000;

// ---------------------------------------------------------------------------
// Fetch mock
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Create a resolved fetch response with a given status */
function makeFetchResponse(status: NoteStatus) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status }),
  } as Response);
}

/** Create a failed fetch response (HTTP error) */
function makeErrorResponse(httpStatus = 500) {
  return Promise.resolve({
    ok: false,
    status: httpStatus,
    json: () => Promise.resolve({ error: "Internal Server Error" }),
  } as Response);
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
describe("useNotePolling — initial state", () => {
  it("has 'idle' status initially", () => {
    const { result } = renderHook(() => useNotePolling());
    expect(result.current.status).toBe("idle");
  });

  it("isPolling is false initially", () => {
    const { result } = renderHook(() => useNotePolling());
    expect(result.current.isPolling).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// startPolling
// ---------------------------------------------------------------------------
describe("useNotePolling — startPolling", () => {
  it("sets isPolling to true after startPolling is called", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    expect(result.current.isPolling).toBe(true);
  });

  it("fetches /api/notes/:id/status on first poll", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-abc");
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/notes/note-abc/status");
  });

  it("updates status to 'processing' from the API response", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    expect(result.current.status).toBe("processing");
  });

  it("polls again after POLL_INTERVAL_MS", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    const initialCalls = mockFetch.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(POLL_INTERVAL_MS);
      await Promise.resolve();
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it("does not start a duplicate poll if already polling", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    const callsAfterFirst = mockFetch.mock.calls.length;

    await act(async () => {
      result.current.startPolling("note-456");
      await Promise.resolve();
    });

    // Fetch count should not increase from second startPolling call
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirst);
  });
});

// ---------------------------------------------------------------------------
// Terminal states stop polling automatically
// ---------------------------------------------------------------------------
describe("useNotePolling — terminal states", () => {
  const TERMINAL_STATES: NoteStatus[] = ["summarized", "failed"];

  TERMINAL_STATES.forEach((terminalStatus) => {
    it(`stops polling when status is '${terminalStatus}'`, async () => {
      mockFetch.mockReturnValue(makeFetchResponse(terminalStatus));
      const { result } = renderHook(() => useNotePolling());

      await act(async () => {
        result.current.startPolling("note-123");
        await Promise.resolve();
      });

      expect(result.current.status).toBe(terminalStatus);
      expect(result.current.isPolling).toBe(false);
    });

    it(`does not fetch again after '${terminalStatus}'`, async () => {
      mockFetch.mockReturnValue(makeFetchResponse(terminalStatus));
      const { result } = renderHook(() => useNotePolling());

      await act(async () => {
        result.current.startPolling("note-123");
        await Promise.resolve();
      });

      const callsAtStop = mockFetch.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
      });

      expect(mockFetch.mock.calls.length).toBe(callsAtStop);
    });
  });
});

// ---------------------------------------------------------------------------
// stopPolling
// ---------------------------------------------------------------------------
describe("useNotePolling — stopPolling", () => {
  it("sets isPolling to false when stopPolling is called", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    act(() => {
      result.current.stopPolling();
    });

    expect(result.current.isPolling).toBe(false);
  });

  it("does not fetch again after stopPolling", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    act(() => {
      result.current.stopPolling();
    });

    const callsAfterStop = mockFetch.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
    });

    expect(mockFetch.mock.calls.length).toBe(callsAfterStop);
  });

  it("does nothing when called before startPolling", () => {
    const { result } = renderHook(() => useNotePolling());
    expect(() => {
      act(() => {
        result.current.stopPolling();
      });
    }).not.toThrow();
    expect(result.current.isPolling).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe("useNotePolling — error handling", () => {
  it("sets status to 'failed' and stops polling on HTTP error response", async () => {
    mockFetch.mockReturnValue(makeErrorResponse(500));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.isPolling).toBe(false);
  });

  it("sets status to 'failed' and stops polling on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));
    const { result } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.isPolling).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cleanup on unmount (no memory leak)
// ---------------------------------------------------------------------------
describe("useNotePolling — cleanup on unmount", () => {
  it("stops polling and does not call fetch after unmount", async () => {
    mockFetch.mockReturnValue(makeFetchResponse("processing"));
    const { result, unmount } = renderHook(() => useNotePolling());

    await act(async () => {
      result.current.startPolling("note-123");
      await Promise.resolve();
    });

    unmount();

    const callsAtUnmount = mockFetch.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(POLL_INTERVAL_MS * 5);
    });

    expect(mockFetch.mock.calls.length).toBe(callsAtUnmount);
  });
});
