import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@frontend/components/MouseLock.jsx", async () => {
  const React = await import("react");

  return {
    default: function MockMouseLock({ canvasRef, onLockChange }) {
      return React.createElement("canvas", {
        ref: canvasRef,
        "data-testid": "mouse-lock-canvas",
        onClick: () => onLockChange(true),
        onDoubleClick: () => onLockChange(false),
      });
    },
  };
});

import Timer from "@frontend/components/Timer.jsx";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());

  Object.defineProperty(document, "pointerLockElement", {
    value: null,
    configurable: true,
  });

  document.exitPointerLock = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function startSession(container) {
  const canvas = container.querySelector("canvas");

  canvas.requestPointerLock = vi.fn().mockResolvedValue();

  fireEvent.click(screen.getByRole("button", { name: /start session/i }));

  await act(async () => {
    await Promise.resolve();
  });

  fireEvent.click(canvas);

  return canvas;
}

function renderTimer(props = {}) {
  return render(
    <MemoryRouter>
      <Timer {...props} />
    </MemoryRouter>,
  );
}

describe("Timer", () => {
  it("renders the initial timer, controls, and canvas", () => {
    const { container } = renderTimer();

    expect(screen.getByRole("heading", { name: "25:00" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start session/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/press stop button or esc to stop timer/i),
    ).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("shows an error when pointer lock fails with SecurityError", async () => {
    const { container } = renderTimer();

    const canvas = container.querySelector("canvas");
    const button = screen.getByRole("button", { name: /start session/i });

    vi.spyOn(canvas, "requestPointerLock").mockRejectedValueOnce(
      Object.assign(new Error("Denied"), { name: "SecurityError" }),
    );

    fireEvent.click(button);

    expect(
      await screen.findByText(/cannot start the session that quick :\//i),
    ).toBeInTheDocument();
  });

  it("changes the session button when the lock becomes active and stops the session", async () => {
    const { container } = renderTimer();

    const canvas = await startSession(container);

    expect(
      screen.getByRole("button", { name: /stop session/i }),
    ).toBeInTheDocument();

    Object.defineProperty(document, "pointerLockElement", {
      value: canvas,
      configurable: true,
    });

    fireEvent.click(screen.getByRole("button", { name: /stop session/i }));

    expect(document.exitPointerLock).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /start session/i }),
    ).toBeInTheDocument();
  });

  it("clears pointer lock SecurityError message after five seconds", async () => {
  vi.useFakeTimers();

  const { container } = renderTimer();

  const canvas = container.querySelector("canvas");

  canvas.requestPointerLock = vi.fn().mockRejectedValueOnce(
    Object.assign(new Error("Denied"), { name: "SecurityError" }),
  );

  fireEvent.click(screen.getByRole("button", { name: /start session/i }));

  await act(async () => {
    await Promise.resolve();
  });

  expect(
    screen.getByText(/cannot start the session that quick :\//i),
  ).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(
    screen.queryByText(/cannot start the session that quick :\//i),
  ).not.toBeInTheDocument();
});

it("falls back to normal pointer lock when unadjusted movement is unsupported", async () => {
  const { container } = renderTimer();

  const canvas = container.querySelector("canvas");

  canvas.requestPointerLock = vi
    .fn()
    .mockRejectedValueOnce(
      Object.assign(new Error("Unsupported"), { name: "NotSupportedError" }),
    )
    .mockResolvedValueOnce();

  fireEvent.click(screen.getByRole("button", { name: /start session/i }));

  await act(async () => {
    await Promise.resolve();
  });

  expect(canvas.requestPointerLock).toHaveBeenCalledTimes(2);
  expect(canvas.requestPointerLock).toHaveBeenNthCalledWith(1, {
    unadjustedMovement: true,
  });
  expect(canvas.requestPointerLock).toHaveBeenNthCalledWith(2);
});

it("logs unexpected pointer lock errors", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  const { container } = renderTimer();

  const canvas = container.querySelector("canvas");
  const error = Object.assign(new Error("Unexpected"), {
    name: "UnknownError",
  });

  canvas.requestPointerLock = vi.fn().mockRejectedValueOnce(error);

  fireEvent.click(screen.getByRole("button", { name: /start session/i }));

  await act(async () => {
    await Promise.resolve();
  });

  expect(consoleError).toHaveBeenCalledWith(error);
  expect(
    screen.queryByText(/cannot start the session that quick :\//i),
  ).not.toBeInTheDocument();
});

it("counts down while running", async () => {
  vi.useFakeTimers();

  const { container } = renderTimer();

  await startSession(container);

  expect(
    screen.getByRole("button", { name: /stop session/i }),
  ).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByRole("heading", { name: "24:59" })).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(2000);
  });

  expect(screen.getByRole("heading", { name: "24:57" })).toBeInTheDocument();
});

it("saves completed focus time and switches to a short break", async () => {
  vi.useFakeTimers();

  fetch.mockResolvedValueOnce({ ok: true });

  const { container } = renderTimer({ userId: "user-123" });

  await startSession(container);

  await act(async () => {
    vi.advanceTimersByTime(1500 * 1000);
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(fetch).toHaveBeenCalledTimes(1);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/users/user-123/study-time"),
    expect.objectContaining({
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: 1500 / 3600 }),
    }),
  );

  expect(
    screen.getByText(/session complete! press the button to continue/i),
  ).toBeInTheDocument();

  expect(screen.getByRole("heading", { name: "05:00" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /start session/i }),
  ).toBeInTheDocument();
});

it("shows a network error when saving completed study time fails", async () => {
  vi.useFakeTimers();

  fetch.mockResolvedValueOnce({ ok: false });

  const { container } = renderTimer();

  await startSession(container);

  await act(async () => {
    vi.advanceTimersByTime(1500 * 1000);
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(
    screen.getByText(/network error: failed to update study time/i),
  ).toBeInTheDocument();
});

});
