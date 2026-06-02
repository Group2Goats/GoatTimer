import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Timer from "@frontend/components/Timer.jsx";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Timer", () => {
  it("renders the initial timer, controls, and canvas", () => {
    const { container } = render(
      <MemoryRouter>
        <Timer />
      </MemoryRouter>,
    );

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
    const { container } = render(
      <MemoryRouter>
        <Timer />
      </MemoryRouter>,
    );

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

  it("changes the session button when pointer lock becomes active and stops the session", async () => {
    const { container } = render(
      <MemoryRouter>
        <Timer />
      </MemoryRouter>,
    );

    const canvas = container.querySelector("canvas");
    const startButton = screen.getByRole("button", { name: /start session/i });

    vi.spyOn(canvas, "requestPointerLock").mockResolvedValueOnce();

    fireEvent.click(startButton);
    await Promise.resolve();

    Object.defineProperty(document, "pointerLockElement", {
      value: canvas,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event("pointerlockchange"));
    });

    const stopButton = await screen.findByRole("button", { name: /stop session/i });
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(document.exitPointerLock).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: /start session/i }),
    ).toBeInTheDocument();
  });
});
