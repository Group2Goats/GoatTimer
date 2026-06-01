import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Profile from "@frontend/components/Profile.jsx";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

const profileUser = {
  _id: "user-123",
  name: "maastest",
  email: "maastest@example.com",
  age: 19,
  interests: ["math"],
  profileVisibility: "public",
  featureSettings: {
    groupsEnabled: true,
    leaderboardEnabled: true,
  },
};

function mockFetchResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

function renderProfile(fetchMock) {
  vi.stubGlobal("fetch", fetchMock);

  render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Profile", () => {
  it("saves an edited username with the rest of the profile data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse({ user: profileUser }))
      .mockResolvedValueOnce(
        mockFetchResponse({
          ...profileUser,
          name: "New Goat",
        }),
      );

    renderProfile(fetchMock);

    const usernameInput = await screen.findByLabelText(/username/i);
    expect(usernameInput).toHaveValue("maastest");

    fireEvent.change(usernameInput, { target: { value: "  New Goat  " } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, options] = fetchMock.mock.calls[1];
    const body = JSON.parse(options.body);

    expect(url).toBe(`${AZURE_URL}/api/users/user-123`);
    expect(options).toEqual(
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        name: "New Goat",
        age: 19,
        interests: ["math"],
        profileVisibility: "public",
        featureSettings: {
          groupsEnabled: true,
          leaderboardEnabled: true,
        },
      }),
    );
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
    expect(usernameInput).toHaveValue("New Goat");
  });

  it("rejects blank usernames before sending a profile update", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse({ user: profileUser }));

    renderProfile(fetchMock);

    const usernameInput = await screen.findByLabelText(/username/i);

    fireEvent.change(usernameInput, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
