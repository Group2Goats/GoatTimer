import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import HomePage from "@frontend/components/Home.jsx";

describe("Home", () => {
  it("renders the landing content and auth links", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /goattimer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/study to become the g\.o\.a\.t/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(
      screen.getByRole("link", { name: /i already have an account/i }),
    ).toHaveAttribute("href", "/login");
  });
});
