import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Leaderboard from "@frontend/components/Leaderboard.jsx";

function mockFetchResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Leaderboard", () => {
  it("renders the loading state", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<Leaderboard />);

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
  });

  it("renders populated global results and highlights the current user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        mockFetchResponse({
          scope: "global",
          entries: [
            {
              rank: 1,
              userId: "user-1",
              name: "Afredo",
              weeklyHours: 100,
              isCurrentUser: false,
            },
            {
              rank: 2,
              userId: "user-2",
              name: "Adrian",
              weeklyHours: 99.25,
              isCurrentUser: true,
            },
          ],
        }),
      ),
    );

    render(<Leaderboard />);

    expect(await screen.findByText("Afredo")).toBeInTheDocument();
    expect(screen.getByText("Adrian")).toBeInTheDocument();
    expect(screen.getByText("99.3h")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Adrian").closest("li")).toHaveClass(
      "current-user",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/leaderboard?scope=global&limit=5",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("renders a group empty state when the user has no group", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        mockFetchResponse({
          scope: "global",
          entries: [],
        }),
      ),
    );

    render(<Leaderboard />);

    fireEvent.click(screen.getByRole("button", { name: /group/i }));

    expect(
      await screen.findByText(/create or join a group/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("loads group results when a group id is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        mockFetchResponse({
          scope: "group",
          entries: [
            {
              rank: 1,
              userId: "user-2",
              name: "Adrian",
              weeklyHours: 12,
              isCurrentUser: true,
            },
          ],
        }),
      ),
    );

    render(<Leaderboard groupId="665f5d34f1d2c3b4a5968701" />);

    fireEvent.click(screen.getByRole("button", { name: /group/i }));

    expect(await screen.findByText("Adrian")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/leaderboard?scope=group&limit=5&groupId=665f5d34f1d2c3b4a5968701",
        expect.objectContaining({ credentials: "include" }),
      ),
    );
  });
});
