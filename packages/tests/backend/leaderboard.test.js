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

function createGroupQuery(group) {
  const query = {};

  query.findById = vi.fn(() => query);
  query.populate = vi.fn(() => query);
  query.lean = vi.fn().mockResolvedValue(group);

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

  it("returns group members ranked by total hours when group scope is requested", async () => {
    const groupData = {
      _id: "665f5d34f1d2c3b4a5968701",
      name: "Study Group",
      users: [
        { _id: "user-1", name: "aras", totalHours: 20 },
        { _id: "user-2", name: "maastest", totalHours: 1.001111111111111 },
      ],
    };

    const GroupModel = {
      findById: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(groupData),
    };

    const handler = createLeaderboardHandler({ GroupModel });
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

    expect(GroupModel.findById).toHaveBeenCalledWith(
      "665f5d34f1d2c3b4a5968701",
    );
    expect(res.json).toHaveBeenCalledWith({
      scope: "group",
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

  it("returns 404 when group is not found", async () => {
    const GroupModel = {
      findById: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    };

    const handler = createLeaderboardHandler({ GroupModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-1" },
        query: {
          scope: "group",
          groupId: "665f5d34f1d2c3b4a5968701",
        },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Group not found",
    });
  });

  it("returns 400 for invalid group ID format", async () => {
    const GroupModel = {};

    const handler = createLeaderboardHandler({ GroupModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-1" },
        query: {
          scope: "group",
          groupId: "invalid-id",
        },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid group ID",
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
