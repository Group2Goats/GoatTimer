import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Timer from "@frontend/components/Timer.jsx";

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
});
