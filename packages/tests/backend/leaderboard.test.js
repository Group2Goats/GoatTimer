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

  query.populate = vi.fn(() => query);
  query.lean = vi.fn().mockResolvedValue(group);

  return query;
}

describe("leaderboard route handler", () => {
  it("returns global users ranked by weekly hours", async () => {
    const userQuery = createUserQuery([
      { _id: "user-1", name: "Afredo", weeklyHours: 100 },
      { _id: "user-2", name: "Adrian", weeklyHours: 99 },
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
    expect(userQuery.sort).toHaveBeenCalledWith({ weeklyHours: -1, name: 1 });
    expect(userQuery.limit).toHaveBeenCalledWith(2);
    expect(userQuery.select).toHaveBeenCalledWith("name email weeklyHours");
    expect(res.json).toHaveBeenCalledWith({
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
          weeklyHours: 99,
          isCurrentUser: true,
        },
      ],
    });
  });

  it("returns group users ranked by weekly hours", async () => {
    const groupId = "665f5d34f1d2c3b4a5968701";
    const groupQuery = createGroupQuery({
      _id: groupId,
      users: [
        { _id: "user-1", name: "Afredo", weeklyHours: 7 },
        { _id: "user-2", name: "Adrian", weeklyHours: 12 },
        { _id: "user-3", name: "Bryan", weeklyHours: 4 },
      ],
    });
    const GroupModel = {
      findById: vi.fn(() => groupQuery),
    };
    const handler = createLeaderboardHandler({ GroupModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-2" },
        query: { scope: "group", groupId, limit: "3" },
      },
      res,
    );

    expect(GroupModel.findById).toHaveBeenCalledWith(groupId);
    expect(groupQuery.populate).toHaveBeenCalledWith(
      "users",
      "name email weeklyHours",
    );
    expect(res.json).toHaveBeenCalledWith({
      scope: "group",
      entries: [
        {
          rank: 1,
          userId: "user-2",
          name: "Adrian",
          weeklyHours: 12,
          isCurrentUser: true,
        },
        {
          rank: 2,
          userId: "user-1",
          name: "Afredo",
          weeklyHours: 7,
          isCurrentUser: false,
        },
        {
          rank: 3,
          userId: "user-3",
          name: "Bryan",
          weeklyHours: 4,
          isCurrentUser: false,
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

  it("rejects group requests without a valid group id", async () => {
    const handler = createLeaderboardHandler();
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-1" },
        query: { scope: "group", groupId: "not-valid" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Valid groupId is required",
    });
  });

  it("rejects group requests from non-members", async () => {
    const groupId = "665f5d34f1d2c3b4a5968701";
    const groupQuery = createGroupQuery({
      _id: groupId,
      users: [{ _id: "user-2", name: "Adrian", weeklyHours: 12 }],
    });
    const GroupModel = {
      findById: vi.fn(() => groupQuery),
    };
    const handler = createLeaderboardHandler({ GroupModel });
    const res = createResponse();

    await handler(
      {
        auth: { userId: "user-1" },
        query: { scope: "group", groupId },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "You are not a member of this group",
    });
  });
});
