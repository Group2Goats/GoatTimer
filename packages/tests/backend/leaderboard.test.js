import { beforeEach, describe, expect, it, vi } from "vitest";

const { Group, User } = vi.hoisted(() => ({
  Group: {
    findById: vi.fn(),
    populate: vi.fn(),
    lean: vi.fn(),
  },
  User: {
    find: vi.fn(),
  },
}));

vi.mock("@backend/models/group.js", () => ({ default: Group }));
vi.mock("@backend/models/user.js", () => ({ default: User }));

import { leaderboardHandler } from "@backend/routes/leaderboard.js";

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
  beforeEach(() => {
    User.find.mockReset();
    Group.findById.mockReset();
    Group.populate.mockReset();
    Group.lean.mockReset();
  });

  it("returns global users ranked by total hours", async () => {
    const userQuery = createUserQuery([
      { _id: "user-1", name: "aras", totalHours: 20 },
      { _id: "user-2", name: "maastest", totalHours: 1.001111111111111 },
    ]);
    User.find.mockReturnValue(userQuery);
    const res = createResponse();

    await leaderboardHandler(
      {
        auth: { userId: "user-2" },
        query: { scope: "global", limit: "2" },
      },
      res,
    );

  expect(User.find).toHaveBeenCalledWith({
  profileVisibility: "public",
  });
  expect(userQuery.sort).toHaveBeenCalledWith({ totalHours: -1, name: 1 });
  expect(userQuery.limit).toHaveBeenCalledWith(2);
  expect(userQuery.select).toHaveBeenCalledWith(
    "name email totalHours profileVisibility",
  );
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

    Group.findById.mockReturnValue(Group);
    Group.populate.mockReturnValue(Group);
    Group.lean.mockResolvedValue(groupData);
    const res = createResponse();

    await leaderboardHandler(
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

    expect(Group.findById).toHaveBeenCalledWith("665f5d34f1d2c3b4a5968701");
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
    Group.findById.mockReturnValue(Group);
    Group.populate.mockReturnValue(Group);
    Group.lean.mockResolvedValue(null);
    const res = createResponse();

    await leaderboardHandler(
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
    const res = createResponse();

    await leaderboardHandler(
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
    const res = createResponse();

    await leaderboardHandler({ query: { scope: "global" } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authentication required",
    });
  });
});
