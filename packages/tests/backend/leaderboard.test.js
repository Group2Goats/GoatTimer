import { describe, expect, it, vi } from "vitest";
import { createLeaderboardHandler } from "@backend/routes/leaderboard.js";

function createResponse() {
  const res = {};

  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);

  return res;
}

function createUserQuery(users) {
  const query = {};

  query.sort = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.select = vi.fn(() => query);
  query.lean = vi.fn().mockResolvedValue(users);

  return query;
}

describe("leaderboard route handler", () => {
  it("returns global users ranked by total hours", async () => {
    const userQuery = createUserQuery([
      { _id: "user-1", name: "aras", totalHours: 20 },
      { _id: "user-2", name: "maastest", totalHours: 1.001111111111111 },
    ]);
    const UserModel = {
      find: vi.fn(() => userQuery),
    };
    const handler = createLeaderboardHandler({ UserModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-2" },
        query: { scope: "global", limit: "2" },
      },
      res,
    );

    expect(UserModel.find).toHaveBeenCalledOnce();
    expect(userQuery.sort).toHaveBeenCalledWith({ totalHours: -1, name: 1 });
    expect(userQuery.limit).toHaveBeenCalledWith(2);
    expect(userQuery.select).toHaveBeenCalledWith("name email totalHours");
    expect(res.json).toHaveBeenCalledWith({
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
    });
  });

  it("fetches across all users even if a group scope is requested", async () => {
    const userQuery = createUserQuery([
      { _id: "user-1", name: "aras", totalHours: 20 },
      { _id: "user-2", name: "maastest", totalHours: 1.001111111111111 },
    ]);
    const UserModel = {
      find: vi.fn(() => userQuery),
    };
    const handler = createLeaderboardHandler({ UserModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-2" },
        query: {
          scope: "group",
          groupId: "665f5d34f1d2c3b4a5968701",
          limit: "5",
        },
      },
      res,
    );

    expect(UserModel.find).toHaveBeenCalledOnce();
    expect(userQuery.sort).toHaveBeenCalledWith({ totalHours: -1, name: 1 });
    expect(res.json).toHaveBeenCalledWith({
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
    });
  });

  it("rejects requests without auth", async () => {
    const handler = createLeaderboardHandler();
    const res = createResponse();

    await handler({ query: { scope: "global" } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authentication required",
    });
  });
});
