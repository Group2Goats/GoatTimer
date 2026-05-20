import { render, screen } from "@testing-library/react";
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
  const user = {
    totalHours: 42.5,
  };

  it("renders the loading state", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<Leaderboard user={user} />);

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
  });

  it("renders user statistics, global results, and highlights the current user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        mockFetchResponse({
          scope: "global",
          entries: [
            {
              rank: 1,
              userId: "user-1",
              name: "aras",
              totalHours: 20,
              isCurrentUser: false,
            },
            {
              rank: 2,
              userId: "user-2",
              name: "maastest",
              totalHours: 1.001111111111111,
              isCurrentUser: true,
            },
          ],
        }),
      ),
    );

    render(<Leaderboard user={user} />);

    expect(screen.getByLabelText(/your study statistics/i)).toBeInTheDocument();
    expect(screen.getByText("42.5h")).toBeInTheDocument();
    expect(screen.getByText(/all time/i)).toBeInTheDocument();
    expect(screen.getByText(/top global users/i)).toBeInTheDocument();
    expect(await screen.findByText("aras")).toBeInTheDocument();
    expect(screen.getByText("maastest")).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("maastest").closest("li")).toHaveClass(
      "current-user",
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net/api/users/leaderboard?limit=5&scope=global",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("renders an empty state when there are no global leaderboard results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        mockFetchResponse({
          scope: "global",
          entries: [],
        }),
      ),
    );

    render(<Leaderboard user={user} />);

    expect(
      await screen.findByText(/no study time yet/i),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net/api/users/leaderboard?limit=5&scope=global",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
